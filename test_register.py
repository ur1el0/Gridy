import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gridy.settings')
django.setup()

from gridy_auth.serializers.registration import RegisterSerializer

data = {
    "username": "CID-MINOR",
    "email": "minor@test.com",
    "password": "Password123!",
    "full_name": "Test Minor",
    "birth_date": "2015-01-01",
    "voter_status": False,
    "contact_number": "",
    "guardian_id": ""
}

serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    try:
        serializer.save()
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("Validation failed:", serializer.errors)
