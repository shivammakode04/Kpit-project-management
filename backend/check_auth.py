#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowforge.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import CustomUser

def check_auth_tokens():
    print("=== Checking Authentication ===")
    
    # Get a test user
    user = CustomUser.objects.filter(username='admin_test').first()
    if not user:
        print("No admin_test user found")
        return
    
    print(f'User: {user.username} (role: {user.role})')
    print(f'Is active: {user.is_active}')
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    
    print(f'Access Token: {str(access_token)[:50]}...')
    print(f'Refresh Token: {str(refresh)[:50]}...')
    
    # Test token validity
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from rest_framework.request import Request
    from django.http import HttpRequest
    
    # Create a mock request with the token
    request = HttpRequest()
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    drf_request = Request(request)
    
    jwt_auth = JWTAuthentication()
    try:
        auth_result = jwt_auth.authenticate(drf_request)
        if auth_result:
            auth_user, validated_token = auth_result
            print(f'Token validation: SUCCESS')
            print(f'Authenticated user: {auth_user.username}')
        else:
            print('Token validation: FAILED - No auth result')
    except Exception as e:
        print(f'Token validation: FAILED - {str(e)}')

if __name__ == '__main__':
    check_auth_tokens()
