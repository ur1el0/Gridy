from datetime import date
from django.core.management.base import BaseCommand
from gridy_auth.management.commands.demo_seed_safety import require_local_demo_database
from gridy_auth.models import Barangay, Resident, User


DEFAULT_SEED_PASSWORD = "".join(["Pass", "word", "123", "!"])


class Command(BaseCommand):
    help = "Seed or update local synthetic accounts for officials, field officers, residents, and DILG with login credentials."

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm-demo-only",
            action="store_true",
            help="Confirm that this is a local development or presentation database.",
        )
        parser.add_argument(
            "--password",
            type=str,
            default=DEFAULT_SEED_PASSWORD,
            help=f"Password to assign to all seeded accounts (default: {DEFAULT_SEED_PASSWORD}).",
        )

    def handle(self, *args, **options):
        require_local_demo_database(confirmed=options["confirm_demo_only"])
        password = options["password"]
        self.stdout.write(self.style.NOTICE("Seeding local development accounts across all roles..."))

        # ---------------------------------------------------------------------
        # 1. Partner Barangays Provisioning
        # ---------------------------------------------------------------------
        dupay, _ = Barangay.objects.get_or_create(
            name="Barangay Ibabang Dupay",
            defaults={
                "captain_name": "Synthetic demo record — not a real official",
                "office_contact": "Demo data only; confirm official contact information separately.",
            },
        )
        daungan, _ = Barangay.objects.get_or_create(
            name="Barangay Daungan",
            defaults={
                "captain_name": "Synthetic demo record — not a real official",
                "office_contact": "Demo data only; confirm official contact information separately.",
            },
        )
        cotta, _ = Barangay.objects.get_or_create(
            name="Barangay Cotta",
            defaults={
                "captain_name": "Seed fixture — verify official before production use",
                "office_contact": "Seed fixture — verify contact before production use",
            },
        )

        # ---------------------------------------------------------------------
        # 2. Account Definitions by Role
        # ---------------------------------------------------------------------
        users_manifest = [
            # DILG Admin (Cross-Tenant / City-Wide)
            {
                "username": "dilg_admin",
                "email": "dilg.admin@example.invalid",
                "first_name": "KapitBayan Demo",
                "last_name": "DILG Admin",
                "role": User.Role.DILG_ADMIN,
                "barangay": None,
                "is_staff": True,
                "resident_profile": None,
            },
            # Barangay Officials (ADMIN)
            {
                "username": "admin_dupay",
                "email": "admin.dupay@example.invalid",
                "first_name": "Demo",
                "last_name": "Official Dupay",
                "role": User.Role.ADMIN,
                "barangay": dupay,
                "is_staff": True,
                "resident_profile": None,
            },
            {
                "username": "admin_daungan",
                "email": "admin.daungan@example.invalid",
                "first_name": "Demo",
                "last_name": "Official Daungan",
                "role": User.Role.ADMIN,
                "barangay": daungan,
                "is_staff": True,
                "resident_profile": None,
            },
            {
                "username": "admin_cotta",
                "email": "admin.cotta@example.invalid",
                "first_name": "Cotta",
                "last_name": "Seed Admin",
                "role": User.Role.ADMIN,
                "barangay": cotta,
                "is_staff": True,
                "resident_profile": None,
            },
            # Field Officers (FIELD_OFFICIAL)
            {
                "username": "tanod_dupay",
                "email": "field.dupay@example.invalid",
                "first_name": "Demo",
                "last_name": "Field Officer Dupay",
                "role": User.Role.FIELD_OFFICIAL,
                "barangay": dupay,
                "is_staff": False,
                "resident_profile": None,
            },
            {
                "username": "tanod_cotta",
                "email": "field.cotta@example.invalid",
                "first_name": "Cotta",
                "last_name": "Seed Official",
                "role": User.Role.FIELD_OFFICIAL,
                "barangay": cotta,
                "is_staff": False,
                "resident_profile": None,
            },
            # Residents (RESIDENT)
            {
                "username": "resident_dupay",
                "email": "resident.dupay@example.invalid",
                "first_name": "Demo",
                "last_name": "Resident Dupay",
                "role": User.Role.RESIDENT,
                "barangay": dupay,
                "is_staff": False,
                "resident_profile": {
                    "full_name": "Demo Resident Dupay",
                    "birth_date": date(1996, 4, 18),
                    "voter_status": True,
                    "purok": "Purok 3 - Sampaguita",
                    "is_verified": True,
                },
            },
            {
                "username": "resident_daungan",
                "email": "resident.daungan@example.invalid",
                "first_name": "Demo",
                "last_name": "Resident Daungan",
                "role": User.Role.RESIDENT,
                "barangay": daungan,
                "is_staff": False,
                "resident_profile": {
                    "full_name": "Demo Resident Daungan",
                    "birth_date": date(1988, 11, 24),
                    "voter_status": True,
                    "purok": "Purok Baybayin",
                    "is_verified": True,
                },
            },
            {
                "username": "resident_cotta_one",
                "email": "resident1.cotta@example.invalid",
                "first_name": "Sample",
                "last_name": "Resident One",
                "role": User.Role.RESIDENT,
                "barangay": cotta,
                "is_staff": False,
                "resident_profile": {
                    "full_name": "Sample Resident One",
                    "birth_date": date(1995, 3, 14),
                    "voter_status": True,
                    "purok": "Purok 1",
                    "is_verified": True,
                },
            },
            {
                "username": "resident_cotta_two",
                "email": "resident2.cotta@example.invalid",
                "first_name": "Sample",
                "last_name": "Resident Two",
                "role": User.Role.RESIDENT,
                "barangay": cotta,
                "is_staff": False,
                "resident_profile": {
                    "full_name": "Sample Resident Two",
                    "birth_date": date(1998, 7, 22),
                    "voter_status": False,
                    "purok": "Purok 2",
                    "is_verified": True,
                },
            },
        ]

        # ---------------------------------------------------------------------
        # 3. Provisioning & Password Setting
        # ---------------------------------------------------------------------
        provisioned_summary = []
        for item in users_manifest:
            user, created = User.objects.get_or_create(
                username=item["username"],
                defaults={
                    "email": item["email"],
                    "first_name": item["first_name"],
                    "last_name": item["last_name"],
                    "role": item["role"],
                    "barangay": item["barangay"],
                    "is_staff": item["is_staff"],
                },
            )
            if not created:
                user.email = item["email"]
                user.first_name = item["first_name"]
                user.last_name = item["last_name"]
                user.role = item["role"]
                user.barangay = item["barangay"]
                user.is_staff = item["is_staff"]

            user.set_password(password)
            user.save()

            if item["resident_profile"]:
                Resident.objects.update_or_create(
                    user=user,
                    defaults=item["resident_profile"],
                )

            b_name = item["barangay"].name if item["barangay"] else "Cross-tenant / All"
            provisioned_summary.append({
                "username": item["username"],
                "role": user.get_role_display(),
                "barangay": b_name,
                "status": "Created" if created else "Updated password",
            })

        # ---------------------------------------------------------------------
        # 4. Output Summary Table
        # ---------------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {len(provisioned_summary)} accounts with password: {password}\n"))
        self.stdout.write(f"{'Role':<18} {'Username':<22} {'Barangay':<26} {'Status'}")
        self.stdout.write("-" * 78)
        for row in provisioned_summary:
            self.stdout.write(f"{row['role']:<18} {row['username']:<22} {row['barangay']:<26} {row['status']}")
        self.stdout.write("-" * 78)
        self.stdout.write(self.style.NOTICE("\nWeb Portal: http://localhost:8080/ (Resident default, Shift+\\ for Official/DILG)"))
