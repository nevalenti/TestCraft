import os
from pathlib import Path

from django.apps import apps
from django.contrib.auth import get_user_model


email = os.environ["DJANGO_SUPERUSER_EMAIL"]
password = os.environ["DJANGO_SUPERUSER_PASSWORD"]
domain = os.environ["GLITCHTIP_DOMAIN"].rstrip("/")

User = get_user_model()
user, _ = User.objects.get_or_create(email=email)
user.is_active = True
user.is_staff = True
user.is_superuser = True
user.set_password(password)
user.save()

Organization = apps.get_model("organizations_ext", "Organization")
Project = apps.get_model("projects", "Project")
Team = apps.get_model("teams", "Team")
ProjectKey = apps.get_model("projects", "ProjectKey")

organization, _ = Organization.objects.get_or_create(
    slug="testcraft",
    defaults={"name": "TestCraft"},
)
if not organization.users.filter(id=user.id).exists():
    organization.add_user(user, role="owner")

team, _ = Team.objects.get_or_create(
    organization=organization,
    slug="testcraft",
)
project, _ = Project.objects.get_or_create(
    organization=organization,
    slug="testcraft",
    defaults={"name": "TestCraft"},
)
team.projects.add(project)

key = ProjectKey.objects.filter(project=project).first()
if key is None:
    key = ProjectKey.objects.create(project=project)

dsn = f"http://{key.public_key}@{domain.removeprefix('http://').removeprefix('https://')}/{project.id}"
output = Path("/output/dsn")
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(dsn + "\n")
