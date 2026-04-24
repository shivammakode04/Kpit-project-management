from django.core.management.base import BaseCommand
from apps.users.models import CustomUser


class Command(BaseCommand):
    help = 'Create test users with different roles'

    def handle(self, *args, **options):
        users_data = [
            {'username': 'admin_user', 'email': 'admin@test.com', 'role': 'admin', 'full_name': 'Admin User'},
            {'username': 'member1', 'email': 'member1@test.com', 'role': 'member', 'full_name': 'Member One'},
            {'username': 'member2', 'email': 'member2@test.com', 'role': 'member', 'full_name': 'Member Two'},
            {'username': 'viewer1', 'email': 'viewer1@test.com', 'role': 'viewer', 'full_name': 'Viewer One'},
        ]

        for user_data in users_data:
            user, created = CustomUser.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'full_name': user_data['full_name'],
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {user.username}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {user.username}'))
