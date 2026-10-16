from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("gridy_communications", "0007_activityschedule_navigator_ai_enabled_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="activityschedule",
            name="navigator_ai_enabled",
        ),
        migrations.RemoveField(
            model_name="announcement",
            name="navigator_ai_enabled",
        ),
    ]
