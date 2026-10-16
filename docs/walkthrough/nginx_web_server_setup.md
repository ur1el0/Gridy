# Nginx Web Container

The frontend Dockerfile builds the React/Vite application in a Node.js build stage, then copies the compiled `dist/` assets into an Nginx image. The exact base images and build steps are maintained in `frontend/Dockerfile`.

## Current Nginx behavior

`frontend/nginx.conf`:

- Serves the compiled SPA from the Nginx document root.
- Uses `try_files` to return `index.html` for client-side routes.
- Proxies `/api/` requests to `http://backend:8000/api/` in the Compose network.
- Enables gzip for configured text-like content types.

This is the containerized local topology. The Vercel rewrite is separately configured in `frontend/vercel.json`; its destination currently differs from the backend host in `backend/.env.example`. Resolve that configuration drift before relying on a hosted same-origin API path.

## Local verification

Build and run Compose from the repository root. Confirm that direct page refreshes reach the SPA fallback, `/api/v1/health/` reaches Django through Nginx, and protected media still goes through the Django authorization layer. Do not expose backend filesystem media paths through Nginx static aliases.

The Docker configuration is not by itself evidence that a hosted reverse proxy has the same behavior. Verify the active deployment separately before describing it as live.
