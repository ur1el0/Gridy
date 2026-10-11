#!/usr/bin/env python3
"""Validate ACR repository-name values in an ARM JSON parameters file."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

MAX_REPOSITORY_NAME_LENGTH = 255
BACKEND_PARAMETER = "acrBackendImageRepositoryName"
FRONTEND_PARAMETER = "acrFrontendImageRepositoryName"

# Docker Distribution path components start and end with lowercase
# alphanumerics. Separators are a period, one or two underscores, or one or
# more hyphens. A repository path may contain slash-delimited components.
_PATH_COMPONENT = re.compile(r"[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*\Z")


class PreflightError(ValueError):
    """An input error safe to display without exposing parameter values."""


def _reject_duplicate_json_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    """Build a JSON object while rejecting ambiguous duplicate keys."""
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise PreflightError("JSON parameter file contains a duplicate object key")
        result[key] = value
    return result


def _reject_non_json_constant(_: str) -> None:
    """Reject JavaScript constants such as NaN that Python's decoder accepts."""
    raise PreflightError("Parameter file contains a non-standard JSON constant")


def validate_repository_name(value: object, parameter_name: str) -> str:
    """Return a valid Docker-compatible repository path or raise safely."""
    if not isinstance(value, str) or not value:
        raise PreflightError(f"{parameter_name} must be a non-empty string")

    if len(value) > MAX_REPOSITORY_NAME_LENGTH:
        raise PreflightError(
            f"{parameter_name} must be no longer than {MAX_REPOSITORY_NAME_LENGTH} characters"
        )

    components = value.split("/")
    if len(components) > 1 and (
        components[0] == "localhost" or "." in components[0]
    ):
        raise PreflightError(
            f"{parameter_name} must not include a registry host-like first component"
        )
    if any(not _PATH_COMPONENT.fullmatch(component) for component in components):
        raise PreflightError(
            f"{parameter_name} must be a lowercase Docker-compatible repository path "
            "without a registry host, tag, or digest"
        )

    return value


def _read_parameter_document(path: Path) -> dict[str, Any]:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        raise PreflightError("Unable to read the UTF-8 JSON parameter file") from error

    try:
        document = json.loads(
            text,
            object_pairs_hook=_reject_duplicate_json_keys,
            parse_constant=_reject_non_json_constant,
        )
    except PreflightError:
        raise
    except ValueError as error:
        raise PreflightError("Parameter file is not valid JSON") from error

    if not isinstance(document, dict):
        raise PreflightError("Parameter file must contain a top-level JSON object")
    return document


def _get_literal_parameter(parameters: dict[str, Any], parameter_name: str) -> str:
    if parameter_name not in parameters:
        raise PreflightError(f"Parameter file is missing {parameter_name}")

    entry = parameters[parameter_name]
    if not isinstance(entry, dict) or set(entry) != {"value"}:
        raise PreflightError(f"{parameter_name} must use a literal string value")

    return validate_repository_name(entry["value"], parameter_name)


def load_repository_parameters(path: Path) -> tuple[str, str]:
    """Load and validate both required repository parameters from JSON."""
    document = _read_parameter_document(path)
    parameters = document.get("parameters")
    if not isinstance(parameters, dict):
        raise PreflightError("Parameter file must contain a parameters object")

    backend_name = _get_literal_parameter(parameters, BACKEND_PARAMETER)
    frontend_name = _get_literal_parameter(parameters, FRONTEND_PARAMETER)
    if backend_name == frontend_name:
        raise PreflightError(
            f"{BACKEND_PARAMETER} and {FRONTEND_PARAMETER} must be distinct"
        )
    return backend_name, frontend_name


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Check ACR repository-name parameters in an ARM JSON parameter file."
    )
    parser.add_argument(
        "parameters_file",
        type=Path,
        help="ARM JSON deployment parameter file to validate",
    )
    arguments = parser.parse_args(argv)

    try:
        load_repository_parameters(arguments.parameters_file)
    except PreflightError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("PASS: backend and frontend ACR repository-name parameters are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
