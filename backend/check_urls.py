#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowforge.settings')
django.setup()

from django.urls import get_resolver, Resolver404
from django.test import RequestFactory
from apps.stories.views import StoryListCreateView

def check_url_routing():
    print("=== Checking URL Routing ===")
    
    # Get the URL resolver
    resolver = get_resolver()
    
    # Test the stories URL
    try:
        factory = RequestFactory()
        request = factory.get('/api/projects/7/stories/')
        
        # Try to resolve the URL
        match = resolver.resolve('/api/projects/7/stories/')
        print(f'URL resolved successfully: {match}')
        print(f'View name: {match.view_name}')
        print(f'Namespace: {match.namespace}')
        print(f'App name: {match.app_name}')
        
        # Check the view class
        if hasattr(match.func, 'view_class'):
            view_class = match.func.view_class
            print(f'View class: {view_class}')
            print(f'View methods: {getattr(view_class, "http_method_names", "Not available")}')
            
            # Check if POST is in allowed methods
            if hasattr(view_class, 'http_method_names'):
                allowed_methods = getattr(view_class, 'http_method_names', [])
                print(f'Allowed HTTP methods: {allowed_methods}')
                if 'post' in allowed_methods:
                    print('✅ POST method is allowed')
                else:
                    print('❌ POST method is NOT in allowed methods')
        
    except Resolver404:
        print('❌ URL not found')
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()

def check_view_directly():
    print("\n=== Checking View Directly ===")
    
    # Check the StoryListCreateView directly
    view = StoryListCreateView()
    print(f'View class: {type(view)}')
    print(f'HTTP method names: {getattr(view, "http_method_names", "Not available")}')
    
    # Check the view's allowed methods
    if hasattr(view, 'http_method_names'):
        allowed_methods = getattr(view, 'http_method_names', [])
        print(f'Allowed methods: {allowed_methods}')
        if 'post' in allowed_methods:
            print('✅ POST method is in allowed methods')
        else:
            print('❌ POST method is NOT in allowed methods')

if __name__ == '__main__':
    check_url_routing()
    check_view_directly()
