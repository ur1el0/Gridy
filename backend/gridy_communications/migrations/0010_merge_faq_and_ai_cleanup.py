from django.db import migrations


class Migration(migrations.Migration):
    """Join the FAQ and retired AI navigator migration branches."""

    dependencies = [
        ("gridy_communications", "0008_remove_navigator_ai_opt_ins"),
        ("gridy_communications", "0009_seed_resident_faqs"),
    ]

    operations = []
