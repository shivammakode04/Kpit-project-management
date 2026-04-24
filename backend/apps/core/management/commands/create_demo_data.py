from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo data for the Agile Project Management SaaS'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing demo data before creating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_demo_data()
        
        self.create_demo_data()
        self.stdout.write(self.style.SUCCESS('Demo data created successfully!'))

    def clear_demo_data(self):
        """Clear existing demo data."""
        from apps.projects.models import Project, ProjectMember
        from apps.stories.models import UserStory
        from apps.tasks.models import Task, TaskAttachment, Comment
        
        self.stdout.write('Clearing existing demo data...')
        
        # Clear in order to avoid foreign key constraints
        Comment.objects.all().delete()
        TaskAttachment.objects.all().delete()
        Task.objects.all().delete()
        UserStory.objects.all().delete()
        ProjectMember.objects.all().delete()
        Project.objects.all().delete()
        
        self.stdout.write('Demo data cleared.')

    def create_demo_data(self):
        """Create comprehensive demo data."""
        from apps.projects.models import Project, ProjectMember
        from apps.stories.models import UserStory
        from apps.tasks.models import Task, TaskAttachment, Comment
        
        self.stdout.write('Creating demo data...')
        
        # Create demo users
        users = self.create_demo_users()
        
        # Create demo projects
        projects = self.create_demo_projects(users)
        
        # Create demo stories
        stories = self.create_demo_stories(projects, users)
        
        # Create demo tasks
        tasks = self.create_demo_tasks(stories, users)
        
        # Create demo comments
        self.create_demo_comments(tasks, users)
        
        # Create demo attachments
        self.create_demo_attachments(tasks, users)
        
        self.stdout.write(f'Created {len(projects)} projects, {len(stories)} stories, {len(tasks)} tasks')

    def create_demo_users(self):
        """Create demo users."""
        demo_users = [
            {
                'username': 'john_doe',
                'email': 'john@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'password': 'demo123',
            },
            {
                'username': 'jane_smith',
                'email': 'jane@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'password': 'demo123',
            },
            {
                'username': 'bob_wilson',
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Wilson',
                'password': 'demo123',
            },
            {
                'username': 'alice_brown',
                'email': 'alice@example.com',
                'first_name': 'Alice',
                'last_name': 'Brown',
                'password': 'demo123',
            },
        ]
        
        users = []
        for user_data in demo_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_active': True,
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
            users.append(user)
        
        return users

    def create_demo_projects(self, users):
        """Create demo projects."""
        project_data = [
            {
                'name': 'E-commerce Platform Redesign',
                'description': 'Complete redesign of the e-commerce platform with modern UI/UX',
                'owner': users[0],
                'start_date': timezone.now() - timedelta(days=30),
                'end_date': timezone.now() + timedelta(days=60),
                'estimated_hours': 160,
                'actual_hours': 120,
                'status': 'in_progress',
            },
            {
                'name': 'Mobile App Development',
                'description': 'Develop cross-platform mobile application for iOS and Android',
                'owner': users[1],
                'start_date': timezone.now() - timedelta(days=15),
                'end_date': timezone.now() + timedelta(days=90),
                'estimated_hours': 200,
                'actual_hours': 80,
                'status': 'in_progress',
            },
            {
                'name': 'Marketing Website',
                'description': 'Create a new marketing website with blog and portfolio sections',
                'owner': users[2],
                'start_date': timezone.now() - timedelta(days=45),
                'end_date': timezone.now() + timedelta(days=30),
                'estimated_hours': 80,
                'actual_hours': 60,
                'status': 'done',
            },
        ]
        
        projects = []
        for data in project_data:
            project = Project.objects.create(**data)
            
            # Add team members
            for user in users[1:3]:  # Add 3 members to each project
                ProjectMember.objects.create(
                    project=project,
                    user=user,
                    role=random.choice(['member', 'admin']),
                    status='accepted',
                )
            
            projects.append(project)
        
        return projects

    def create_demo_stories(self, projects, users):
        """Create demo user stories."""
        stories_data = [
            # E-commerce Platform stories
            {
                'project': projects[0],
                'title': 'User Registration and Authentication',
                'description': 'As a user, I want to register and authenticate securely',
                'status': 'done',
                'priority': 'high',
                'story_points': 8,
                'business_value': 100,
                'acceptance_criteria': 'User can register with email/password, social login available, password reset works',
                'created_by': users[0],
            },
            {
                'project': projects[0],
                'title': 'Product Catalog and Search',
                'description': 'As a shopper, I want to browse and search products easily',
                'status': 'in_progress',
                'priority': 'high',
                'story_points': 13,
                'business_value': 120,
                'acceptance_criteria': 'Advanced search filters, product categories, sorting options work',
                'created_by': users[1],
            },
            {
                'project': projects[0],
                'title': 'Shopping Cart and Checkout',
                'description': 'As a customer, I want to add items to cart and checkout smoothly',
                'status': 'todo',
                'priority': 'medium',
                'story_points': 5,
                'business_value': 80,
                'acceptance_criteria': 'Cart persists, multiple payment options, order confirmation',
                'created_by': users[2],
            },
            
            # Mobile App stories
            {
                'project': projects[1],
                'title': 'User Dashboard',
                'description': 'As a user, I want to view my account dashboard and settings',
                'status': 'done',
                'priority': 'high',
                'story_points': 8,
                'business_value': 90,
                'acceptance_criteria': 'Profile management, activity history, preferences accessible',
                'created_by': users[1],
            },
            {
                'project': projects[1],
                'title': 'Push Notifications',
                'description': 'As a user, I want to receive push notifications for important updates',
                'status': 'in_progress',
                'priority': 'medium',
                'story_points': 5,
                'business_value': 60,
                'acceptance_criteria': 'Push notifications work, user can manage preferences',
                'created_by': users[3],
            },
            
            # Marketing Website stories
            {
                'project': projects[2],
                'title': 'Homepage Design',
                'description': 'As a visitor, I want to see an attractive and professional homepage',
                'status': 'done',
                'priority': 'high',
                'story_points': 3,
                'business_value': 70,
                'acceptance_criteria': 'Modern design, responsive layout, clear navigation',
                'created_by': users[2],
            },
        ]
        
        stories = []
        for data in stories_data:
            story = UserStory.objects.create(**data)
            stories.append(story)
        
        return stories

    def create_demo_tasks(self, stories, users):
        """Create demo tasks."""
        tasks_data = []
        
        for i, story in enumerate(stories):
            # Create 2-4 tasks per story
            num_tasks = random.randint(2, 4)
            assigned_users = random.sample(users, min(num_tasks, len(users)))
            
            for j in range(num_tasks):
                task_data = {
                    'story': story,
                    'title': f'Task {i+1}.{j+1}: {self.get_task_title(story)}',
                    'description': f'Description for task {j+1} of story {story.title}',
                    'status': random.choice(['todo', 'in_progress', 'done']),
                    'priority': random.choice(['low', 'medium', 'high']),
                    'assigned_to': assigned_users[j] if j < len(assigned_users) else None,
                    'due_date': timezone.now() + timedelta(days=random.randint(1, 14)),
                    'estimated_hours': random.randint(2, 16),
                    'actual_hours': random.randint(0, 16),
                    'task_type': random.choice(['feature', 'bug', 'enhancement', 'research']),
                    'labels': random.sample(['urgent', 'frontend', 'backend', 'database', 'ui/ux'], random.randint(1, 3)),
                    'is_blocked': random.choice([True, False]),
                    'created_by': story.created_by,
                }
                tasks_data.append(task_data)
        
        tasks = []
        for data in tasks_data:
            task = Task.objects.create(**data)
            tasks.append(task)
        
        return tasks

    def get_task_title(self, story):
        """Generate relevant task title based on story."""
        titles = {
            'User Registration and Authentication': 'Setup Authentication',
            'Product Catalog and Search': 'Implement Search',
            'Shopping Cart and Checkout': 'Build Cart',
            'User Dashboard': 'Create Dashboard',
            'Push Notifications': 'Setup Push Service',
            'Homepage Design': 'Design Layout',
        }
        return titles.get(story.title, 'Development Task')

    def create_demo_comments(self, tasks, users):
        """Create demo comments."""
        comment_texts = [
            'This looks great! Good work on the implementation.',
            'I think we should consider the edge cases here.',
            'Can we schedule a meeting to discuss this further?',
            'Nice progress! Let me know if you need any help.',
            'This is blocking my work on other tasks.',
            'Great solution! This meets all the requirements.',
            'I have some concerns about the timeline.',
            'Excellent work! Very clean code.',
            'Should we add more tests for this?',
            'This is ready for review.',
        ]
        
        for task in random.sample(tasks, min(10, len(tasks))):
            if random.random() > 0.3:  # 70% chance of having comments
                num_comments = random.randint(1, 3)
                for _ in range(num_comments):
                    Comment.objects.create(
                        task=task,
                        user=random.choice(users),
                        content=random.choice(comment_texts),
                    )

    def create_demo_attachments(self, tasks, users):
        """Create demo file attachments."""
        file_types = [
            {'name': 'requirements.pdf', 'content_type': 'application/pdf', 'size': 1024 * 500},
            {'name': 'design-mockup.png', 'content_type': 'image/png', 'size': 1024 * 2048},
            {'name': 'specification.docx', 'content_type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'size': 1024 * 256},
            {'name': 'test-results.csv', 'content_type': 'text/csv', 'size': 1024 * 128},
        ]
        
        for task in random.sample(tasks, min(8, len(tasks))):
            if random.random() > 0.5:  # 50% chance of having attachments
                file_info = random.choice(file_types)
                TaskAttachment.objects.create(
                    task=task,
                    filename=file_info['name'],
                    file_size=file_info['size'],
                    content_type=file_info['content_type'],
                    uploaded_by=random.choice(users),
                    # Note: In a real implementation, you'd handle actual file upload
                )
