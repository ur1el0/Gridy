"""Tests for the offline ACR repository parameter preflight."""

from __future__ import annotations

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from typing import Any

from check_acr_repository_parameters import (
    PreflightError,
    load_repository_parameters,
    main,
    validate_repository_name,
)


def make_parameter_document(
    backend: Any = "kapitbayan/backend",
    frontend: Any = "kapitbayan/frontend",
) -> dict[str, Any]:
    return {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
            "acrBackendImageRepositoryName": {"value": backend},
            "acrFrontendImageRepositoryName": {"value": frontend},
            "postgresAdministratorPassword": {"value": "must-not-be-printed"},
        },
    }


class ValidateRepositoryNameTests(unittest.TestCase):
    def test_accepts_nested_names_and_supported_separators(self) -> None:
        for name in (
            "backend",
            "foo.bar",
            "kapitbayan/backend-api",
            "namespace/api.v1",
            "foo__bar/x--y",
        ):
            with self.subTest(name=name):
                self.assertEqual(validate_repository_name(name, "repository"), name)

    def test_accepts_name_at_255_character_limit(self) -> None:
        name = "a" * 255
        self.assertEqual(validate_repository_name(name, "repository"), name)

    def test_rejects_invalid_docker_repository_paths_without_echoing_values(self) -> None:
        invalid_names = (
            "",
            "API",
            " leading-space",
            "trailing-space ",
            "/api",
            "api/",
            "api//v1",
            ".api",
            "api.",
            "_api",
            "api_",
            "-api",
            "api-",
            "foo___bar",
            "api:v1",
            "api@sha256:deadbeef",
            "registry.azurecr.io/api",
            "localhost/repository",
            "team.v2/api",
            "api name",
            "café/api",
        )
        for name in invalid_names:
            with self.subTest(name=name):
                with self.assertRaises(PreflightError) as error:
                    validate_repository_name(name, "acrBackendImageRepositoryName")
                self.assertIn("acrBackendImageRepositoryName", str(error.exception))
                if name:
                    self.assertNotIn(name, str(error.exception))

    def test_rejects_name_longer_than_255_characters(self) -> None:
        with self.assertRaises(PreflightError):
            validate_repository_name("a" * 256, "repository")


class LoadRepositoryParametersTests(unittest.TestCase):
    def write_json(self, directory: str, content: str) -> Path:
        path = Path(directory) / "deployment.parameters.json"
        path.write_text(content, encoding="utf-8")
        return path

    def test_loads_two_distinct_literal_repository_names(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_json(directory, json.dumps(make_parameter_document()))
            self.assertEqual(
                load_repository_parameters(path),
                ("kapitbayan/backend", "kapitbayan/frontend"),
            )

    def test_rejects_equal_backend_and_frontend_names(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            document = make_parameter_document("same/image", "same/image")
            path = self.write_json(directory, json.dumps(document))
            with self.assertRaisesRegex(PreflightError, "must be distinct"):
                load_repository_parameters(path)

    def test_rejects_missing_required_parameters(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            document = make_parameter_document()
            del document["parameters"]["acrFrontendImageRepositoryName"]
            path = self.write_json(directory, json.dumps(document))
            with self.assertRaisesRegex(PreflightError, "acrFrontendImageRepositoryName"):
                load_repository_parameters(path)

    def test_rejects_wrong_root_or_parameters_type(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            for content in ("[]", json.dumps({"parameters": []})):
                with self.subTest(content=content):
                    path = self.write_json(directory, content)
                    with self.assertRaises(PreflightError):
                        load_repository_parameters(path)

    def test_rejects_non_literal_or_non_string_parameter_values(self) -> None:
        invalid_entries = (
            {},
            {"reference": {"keyVault": {"id": "secret"}}},
            {"value": 17},
            {"value": None},
            {"value": ["backend"]},
            {"value": "safe", "reference": {"keyVault": {"id": "secret"}}},
        )
        for entry in invalid_entries:
            with self.subTest(entry=entry):
                with tempfile.TemporaryDirectory() as directory:
                    document = make_parameter_document()
                    document["parameters"]["acrBackendImageRepositoryName"] = entry
                    path = self.write_json(directory, json.dumps(document))
                    with self.assertRaisesRegex(PreflightError, "acrBackendImageRepositoryName"):
                        load_repository_parameters(path)

    def test_rejects_malformed_json_without_echoing_file_content(self) -> None:
        secret = "distinctive-not-a-real-secret"
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_json(directory, f'{{"invalid": "{secret}"')
            with self.assertRaises(PreflightError) as error:
                load_repository_parameters(path)
            self.assertNotIn(secret, str(error.exception))

    def test_rejects_duplicate_json_keys(self) -> None:
        content = (
            '{"parameters":{"acrBackendImageRepositoryName":{"value":"one"},'
            '"acrBackendImageRepositoryName":{"value":"two"}}}'
        )
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_json(directory, content)
            with self.assertRaisesRegex(PreflightError, "duplicate"):
                load_repository_parameters(path)

    def test_rejects_non_standard_json_constants(self) -> None:
        content = (
            '{"parameters":{"acrBackendImageRepositoryName":{"value":"backend"},'
            '"acrFrontendImageRepositoryName":{"value":NaN}}}'
        )
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_json(directory, content)
            with self.assertRaises(PreflightError):
                load_repository_parameters(path)

    def test_rejects_invalid_utf8_or_unreadable_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "invalid.json"
            path.write_bytes(b"\xff")
            with self.assertRaises(PreflightError):
                load_repository_parameters(path)
            with self.assertRaises(PreflightError):
                load_repository_parameters(Path(directory) / "missing.json")


class CommandLineTests(unittest.TestCase):
    def write_parameter_file(self, directory: str, backend: Any, frontend: Any) -> Path:
        path = Path(directory) / "deployment.parameters.json"
        path.write_text(json.dumps(make_parameter_document(backend, frontend)), encoding="utf-8")
        return path

    def test_success_message_does_not_echo_repository_names(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_parameter_file(directory, "private/backend-value", "private/frontend-value")
            stdout = io.StringIO()
            stderr = io.StringIO()
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                exit_code = main([str(path)])
            self.assertEqual(exit_code, 0)
            self.assertIn("PASS", stdout.getvalue())
            self.assertEqual(stderr.getvalue(), "")
            self.assertNotIn("backend-value", stdout.getvalue())
            self.assertNotIn("frontend-value", stdout.getvalue())
            self.assertNotIn("must-not-be-printed", stdout.getvalue())

    def test_error_message_identifies_field_without_echoing_invalid_value(self) -> None:
        invalid_value = "PRIVATE/Backend-Value"
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_parameter_file(directory, invalid_value, "private/frontend")
            stdout = io.StringIO()
            stderr = io.StringIO()
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                exit_code = main([str(path)])
            self.assertEqual(exit_code, 1)
            self.assertIn("acrBackendImageRepositoryName", stderr.getvalue())
            self.assertNotIn(invalid_value, stderr.getvalue())
            self.assertNotIn("must-not-be-printed", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
