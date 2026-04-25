#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowforge.settings')
django.setup()

from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import CustomUser
from apps.projects.models import Project, ProjectMember

def test_frontend_request():
    print("=== Testing Frontend Request Simulation ===")
    
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
    
    # Create Django test client
    client = Client()
    
    # Test the exact request the frontend would make
    url = f'/api/projects/{project.id}/stories/'
    data = {
        'title': 'Test Story from Frontend',
        'description': 'Test Description',
        'priority': 'medium'
    }
    headers = {
        'HTTP_AUTHORIZATION': f'Bearer {access_token}',
        'CONTENT_TYPE': 'application/json'
    }
    
    print(f"\n=== Testing POST to {url} ===")
    print(f'Data: {json.dumps(data, indent=2)}')
    print(f'Headers: Authorization Bearer {access_token[:30]}...')
    
    try:
        response = client.post(url, 
                             data=json.dumps(data),
                             content_type='application/json',
                             HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        print(f'Status Code: {response.status_code}')
        print(f'Content-Type: {response.get("Content-Type", "None")}')
        
        if response.status_code == 201:
            print('✅ SUCCESS - Story created')
            response_data = response.json()
            print(f'Response: {json.dumps(response_data, indent=2)[:200]}...')
        elif response.status_code == 400:
            print('❌ BAD REQUEST - Validation error')
            print(f'Error: {response.json()}')
        elif response.status_code == 401:
            print('❌ UNAUTHORIZED - Authentication issue')
            print(f'Error: {response.json()}')
        elif response.status_code == 403:
            print('❌ FORBIDDEN - Permission issue')
            print(f'Error: {response.json()}')
        elif response.status_code == 405:
            print('❌ METHOD NOT ALLOWED')
            print(f'Error: {response.json()}')
        else:
            print(f'❌ OTHER ERROR - Status {response.status_code}')
            print(f'Response: {response.content.decode()[:500]}')
            
    except Exception as e:
        print(f'❌ EXCEPTION: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_frontend_request()
