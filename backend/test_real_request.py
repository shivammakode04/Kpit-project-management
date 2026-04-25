#!/usr/bin/env python
import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowforge.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import CustomUser
from apps.projects.models import Project, ProjectMember

def test_real_http_request():
    print("=== Testing Real HTTP Request ===")
    
    # Get test data
    user = CustomUser.objects.filter(username='admin_test').first()
    project = Project.objects.first()
    
    if not user or not project:
        print("Missing test data")
        return
    
    # Check project membership
    membership = ProjectMember.objects.filter(project=project, user=user).first()
    print(f'User: {user.username}')
    print(f'Project: {project.name} (ID: {project.id})')
    print(f'Membership: {membership.status if membership else "None"}')
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Test the exact request the frontend would make
    url = 'http://localhost:8000/api/projects/7/stories/'
    data = {
        'title': 'Test Story from Frontend',
        'description': 'Test Description',
        'priority': 'medium'
    }
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"\n=== Testing POST to {url} ===")
    print(f'Data: {json.dumps(data, indent=2)}')
    print(f'Headers: Authorization Bearer {access_token[:30]}...')
    
    try:
        response = requests.post(url, 
                              data=json.dumps(data),
                              headers=headers,
                              timeout=10)
        
        print(f'Status Code: {response.status_code}')
        print(f'Content-Type: {response.headers.get("Content-Type", "None")}')
        
        if response.status_code == 201:
            print('✅ SUCCESS - Story created')
            response_data = response.json()
            print(f'Response: {json.dumps(response_data, indent=2)[:200]}...')
        elif response.status_code == 400:
            print('❌ BAD REQUEST - Validation error')
            print(f'Error: {response.text}')
        elif response.status_code == 401:
            print('❌ UNAUTHORIZED - Authentication issue')
            print(f'Error: {response.text}')
        elif response.status_code == 403:
            print('❌ FORBIDDEN - Permission issue')
            print(f'Error: {response.text}')
        elif response.status_code == 405:
            print('❌ METHOD NOT ALLOWED')
            print(f'Error: {response.text}')
        else:
            print(f'❌ OTHER ERROR - Status {response.status_code}')
            print(f'Response: {response.text[:500]}')
            
    except requests.exceptions.ConnectionError:
        print('❌ CONNECTION ERROR - Backend server not running')
    except Exception as e:
        print(f'❌ EXCEPTION: {str(e)}')

if __name__ == '__main__':
    test_real_http_request()
