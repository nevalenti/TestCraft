import os
from urllib.parse import urlparse

from django.apps import apps
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


email = os.environ["DJANGO_SUPERUSER_EMAIL"]
password = os.environ["DJANGO_SUPERUSER_PASSWORD"]
domain = os.environ["GLITCHTIP_DOMAIN"].rstrip("/")
dsn = urlparse(os.environ["GLITCHTIP_DSN"])
public_key = dsn.username
project_id = int(dsn.path.lstrip("/"))

User = get_user_model()
user, _ = User.objects.get_or_create(email=email)
user.is_active = True
user.is_staff = True
user.is_superuser = True
try:
    validate_password(password, user)
except ValidationError:
    if domain != "http://localhost:8001" or password != "admin":
        raise
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
    defaults={"id": project_id, "name": "TestCraft"},
)
if project.id != project_id:
    raise SystemExit(
        f"GLITCHTIP_DSN points at project {project_id}, but the testcraft project is {project.id}"
    )
team.projects.add(project)

ProjectKey.objects.get_or_create(public_key=public_key, defaults={"project": project})
