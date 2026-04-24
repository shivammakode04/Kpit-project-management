from django.core.management.base import BaseCommand
from apps.users.models import CustomUser


class Command(BaseCommand):
    help = 'Make an existing user a superuser'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to make superuser')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = CustomUser.objects.get(username=username)
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully made {username} a superuser'))
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} does not exist'))
