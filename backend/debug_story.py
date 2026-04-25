#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowforge.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.stories.views import StoryListCreateView
from apps.stories.serializers import UserStoryCreateSerializer
from apps.users.models import CustomUser
from apps.projects.models import Project, ProjectMember

def debug_story_creation():
    print("=== Debugging Story Creation ===")
    
    # Get test data
    user = CustomUser.objects.filter(username='admin_test').first()
    project = Project.objects.first()
    
    print(f'User: {user.username if user else "None"} (role: {user.role if user else "None"})')
    print(f'Project: {project.name if project else "None"} (ID: {project.id if project else "None"})')
    
    if not user or not project:
        print("Missing test data")
        return
    
    # Check project membership
    membership = ProjectMember.objects.filter(project=project, user=user).first()
    print(f'Project membership: {membership.status if membership else "None"}')
    
    # Test serializer validation
    print("\n=== Testing Serializer ===")
    test_data = {
        'title': 'Test Story',
        'description': 'Test Description',
        'priority': 'medium'
    }
    
    serializer = UserStoryCreateSerializer(data=test_data)
    print(f'Serializer valid: {serializer.is_valid()}')
    if not serializer.is_valid():
        print(f'Serializer errors: {serializer.errors}')
    else:
        print('Serializer validation passed')
    
    # Test the view with authentication
    print("\n=== Testing View with Authentication ===")
    factory = APIRequestFactory()
    view = StoryListCreateView.as_view()
    
    request = factory.post(f'/api/projects/{project.id}/stories/', test_data, format='json')
    force_authenticate(request, user=user)
    
    try:
        response = view(request, project_id=project.id)
        print(f'View Response Status: {response.status_code}')
        if hasattr(response, 'data'):
            print(f'Response Data: {response.data}')
        else:
            print(f'Response Content: {response.content.decode() if hasattr(response, "content") else "No content"}')
    except Exception as e:
        print(f'View Exception: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_story_creation()
