from collections.abc import Mapping
from http.cookies import Morsel, SimpleCookie, _unquote

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from gridy_auth.models import RefreshSession


class MultiPathCookie(SimpleCookie):
    """
    Subclass of SimpleCookie that preserves multiple Morsels for the same
    cookie name, allowing the response to emit multiple Set-Cookie headers
    (e.g., to expire cookies across multiple paths simultaneously).
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._extra_morsels = []

    def add_cookie(
        self,
        key,
        value="",
        max_age=None,
        expires=None,
        path="/",
        domain=None,
        secure=False,
        httponly=False,
        samesite=None,
    ):
        m = Morsel()
        m.set(key, value, value)
        if max_age is not None:
            m["max-age"] = int(max_age)
        if expires is not None:
            m["expires"] = expires
        if path is not None:
            m["path"] = path
        if domain is not None:
            m["domain"] = domain
        if secure:
            m["secure"] = True
        if httponly:
            m["httponly"] = True
        if samesite:
            m["samesite"] = samesite
        self._extra_morsels.append(m)

    def __len__(self):
        return super().__len__() + len(self._extra_morsels)

    def values(self):
        return list(super().values()) + self._extra_morsels

    def output(self, attrs=None, header="Set-Cookie:", sep="\r\n"):
        lines = []
        if len(super().values()):
            lines.append(super().output(attrs, header, sep))
        for m in self._extra_morsels:
            lines.append(m.output(attrs, header))
        return sep.join(lines)


def extract_refresh_tokens(request):
    """
    Extract all refresh token strings from the incoming request.

    Preserves multiple tokens when the raw HTTP_COOKIE header contains duplicate
    cookie names (such as overlapping / and /api/v1/auth/ paths), preventing
    orphaned database sessions when client browsers submit both cookies.
    """
    tokens = []
    seen = set()

    raw_cookie = request.META.get('HTTP_COOKIE', '')
    if raw_cookie:
        for chunk in raw_cookie.split(';'):
            if '=' in chunk:
                key, val = chunk.split('=', 1)
            else:
                key, val = '', chunk
            key, val = key.strip(), val.strip()
            if key == 'refresh_token' and val:
                unquoted = _unquote(val)
                if unquoted and unquoted not in seen:
                    tokens.append(unquoted)
                    seen.add(unquoted)

    parsed_cookie = request.COOKIES.get('refresh_token')
    if parsed_cookie and parsed_cookie not in seen:
        tokens.append(parsed_cookie)
        seen.add(parsed_cookie)

    try:
        data = getattr(request, 'data', None)
        if isinstance(data, Mapping):
            body_token = data.get('refresh')
            if isinstance(body_token, str) and body_token.strip():
                clean_body_token = body_token.strip()
                if clean_body_token not in seen:
                    tokens.append(clean_body_token)
                    seen.add(clean_body_token)
    except Exception:
        # Malformed or unsupported request bodies must never block cookie-based revocation
        pass

    return tokens


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=None, responses={200: None})
    def post(self, request, *args, **kwargs):
        refresh_tokens = extract_refresh_tokens(request)
        for refresh_token_str in refresh_tokens:
            try:
                token = RefreshToken(refresh_token_str)
                jti = token['jti']

                # Revoke the session in database
                session = RefreshSession.objects.filter(refresh_token_jti=jti, is_revoked=False).first()
                if session:
                    session.is_revoked = True
                    session.save()

                # Blacklist token in outstanding database
                token.blacklist()
            except Exception:
                pass

        # Always return 200 and clear both scoped (/api/v1/auth/) and legacy (/) cookies
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

        samesite_policy = getattr(settings, 'REFRESH_COOKIE_SAMESITE', 'Strict')
        secure_cookie = not settings.DEBUG
        if samesite_policy.lower() == 'none':
            secure_cookie = True

        multi_cookies = MultiPathCookie()
        for k, v in response.cookies.items():
            multi_cookies[k] = v
        response.cookies = multi_cookies

        # Expire current scoped cookie (/api/v1/auth/)
        response.delete_cookie('refresh_token', path='/api/v1/auth/', samesite=samesite_policy)
        if secure_cookie:
            multi_cookies['refresh_token']['secure'] = True
        multi_cookies['refresh_token']['httponly'] = True

        # Expire legacy root-path cookie (/)
        multi_cookies.add_cookie(
            key='refresh_token',
            value="",
            max_age=0,
            expires="Thu, 01 Jan 1970 00:00:00 GMT",
            path="/",
            secure=secure_cookie,
            httponly=True,
            samesite=samesite_policy,
        )

        return response
