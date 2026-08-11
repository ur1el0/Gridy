import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from gridy_auth.models import Resident
from gridy_communications.models import Announcement, ActivitySchedule
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with synthetic data'

    def handle(self, *args, **options):
        fixtures_dir = Path(settings.BASE_DIR) / 'gridy_auth' / 'fixtures'

        # Seed Users
        with open(fixtures_dir / 'seed_users.json', 'r') as f:
            users_data = json.load(f)
            for u_data in users_data:
                profile_data = u_data.pop('resident_profile', None)
                password = u_data.pop('password')
                user, created = User.objects.get_or_create(username=u_data['username'], defaults=u_data)
                if created:
                    user.set_password(password)
                    user.save()
                    if profile_data:
                        Resident.objects.get_or_create(user=user, defaults=profile_data)
                    self.stdout.write(self.style.SUCCESS(f'Created user {user.username}'))
                else:
                    self.stdout.write(f'User {user.username} already exists')

        # Admin user to assign as creator
        admin = User.objects.filter(role=User.Role.ADMIN).first()
        if not admin:
            self.stdout.write(self.style.ERROR('No admin user found to associate announcements/activities with.'))
            return

        # Seed Announcements
        with open(fixtures_dir / 'seed_announcements.json', 'r') as f:
            announcements_data = json.load(f)
            for a_data in announcements_data:
                a_data['created_by'] = admin
                announcement, created = Announcement.objects.get_or_create(title=a_data['title'], defaults=a_data)
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created announcement "{announcement.title}"'))
                else:
                    self.stdout.write(f'Announcement "{announcement.title}" already exists')

        # Seed Activities
        with open(fixtures_dir / 'seed_activities.json', 'r') as f:
            activities_data = json.load(f)
            for act_data in activities_data:
                act_data['created_by'] = admin
                activity, created = ActivitySchedule.objects.get_or_create(title=act_data['title'], defaults=act_data)
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created activity "{activity.title}"'))
                else:
                    self.stdout.write(f'Activity "{activity.title}" already exists')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database.'))
