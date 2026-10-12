import json
import os
import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENTRYPOINT = BACKEND_DIR / "entrypoint.sh"


def _write_recorder(tmp_path: Path, executable: str) -> Path:
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir(exist_ok=True)
    recorder = bin_dir / executable
    recorder.write_text(
        "#!/bin/sh\n"
        'printf \'%s\\n\' "$*" >> "$ENTRYPOINT_COMMAND_LOG"\n',
        encoding="utf-8",
    )
    recorder.chmod(0o755)
    return bin_dir


def test_entrypoint_forwards_server_command_without_running_migrations(tmp_path):
    log_path = tmp_path / "commands.log"
    bin_dir = _write_recorder(tmp_path, "python")
    env = os.environ.copy()
    env["PATH"] = f"{bin_dir}{os.pathsep}{env['PATH']}"
    env["ENTRYPOINT_COMMAND_LOG"] = str(log_path)

    result = subprocess.run(
        ["bash", str(ENTRYPOINT), "python", "manage.py", "runserver", "0.0.0.0:8000"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert log_path.read_text(encoding="utf-8").splitlines() == [
        "manage.py runserver 0.0.0.0:8000"
    ]


def test_entrypoint_preserves_default_gunicorn_command(tmp_path):
    log_path = tmp_path / "commands.log"
    bin_dir = _write_recorder(tmp_path, "gunicorn")
    env = os.environ.copy()
    env["PATH"] = f"{bin_dir}{os.pathsep}{env['PATH']}"
    env["ENTRYPOINT_COMMAND_LOG"] = str(log_path)

    result = subprocess.run(
        ["bash", str(ENTRYPOINT)],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert log_path.read_text(encoding="utf-8").splitlines() == [
        "config.wsgi.application --bind 0.0.0.0:8000 --workers 3"
    ]


def test_database_settings_do_not_resolve_or_pin_postgres_hostname():
    script = """
import json
import socket

calls = []
def record_resolution(host):
    calls.append(host)
    return "203.0.113.41"

socket.gethostbyname = record_resolution
from config.settings import DATABASES

database = DATABASES["default"]
result = {
    "host": database.get("HOST"),
    "hostaddr": database.get("OPTIONS", {}).get("hostaddr"),
    "resolver_calls": calls,
    "conn_max_age": database.get("CONN_MAX_AGE"),
    "conn_health_checks": database.get("CONN_HEALTH_CHECKS"),
}
print(json.dumps(result))
"""
    env = os.environ.copy()
    env.update(
        {
            "SECRET_KEY": "m43-local-settings-test-key",
            "ADMIN_REGISTRATION_PASSKEY": "m43-local-test-passkey",
            "DEBUG": "True",
            "DATABASE_URL": "postgres://test_user:test_password@db.example.test:5432/kapitbayan",
        }
    )

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    settings_result = json.loads(result.stdout)
    assert settings_result == {
        "host": "db.example.test",
        "hostaddr": None,
        "resolver_calls": [],
        "conn_max_age": 60,
        "conn_health_checks": True,
    }
