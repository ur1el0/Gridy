"""Tests for the offline Azure pilot parameter preflight."""

from __future__ import annotations

import contextlib
import io
import ipaddress
import json
import tempfile
import unittest
from pathlib import Path
from typing import Any

from check_azure_pilot_parameters import (
    load_azure_pilot_parameters,
    main,
)


def make_parameter_document(
    *,
    vnet: Any = "10.20.0.0/16",
    aca: Any = "10.20.1.0/27",
    postgres: Any = "10.20.2.0/28",
    private_endpoint: Any = "10.20.3.0/28",
    backend_repository: Any = "kapitbayan/backend",
    frontend_repository: Any = "kapitbayan/frontend",
) -> dict[str, Any]:
    return {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
            "virtualNetworkAddressPrefix": {"value": vnet},
            "containerAppsSubnetAddressPrefix": {"value": aca},
            "postgresSubnetAddressPrefix": {"value": postgres},
            "privateEndpointSubnetAddressPrefix": {"value": private_endpoint},
            "acrBackendImageRepositoryName": {"value": backend_repository},
            "acrFrontendImageRepositoryName": {"value": frontend_repository},
            "postgresAdministratorPassword": {"value": "synthetic-test-secret"},
        },
    }


class AzurePilotParameterTests(unittest.TestCase):
    def write_json(self, directory: str, content: str) -> Path:
        path = Path(directory) / "pilot.parameters.json"
        path.write_text(content, encoding="utf-8")
        return path

    def write_document(self, directory: str, document: dict[str, Any]) -> Path:
        return self.write_json(directory, json.dumps(document))

    def test_accepts_disjoint_subnets_contained_in_vnet(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_document(directory, make_parameter_document())
            self.assertIsNone(load_azure_pilot_parameters(path))

    def test_cli_success_does_not_echo_repository_names_or_cidrs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_document(directory, make_parameter_document())
            stdout = io.StringIO()
            stderr = io.StringIO()
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                exit_code = main([str(path)])
            self.assertEqual(exit_code, 0)
            self.assertIn("PASS", stdout.getvalue())
            self.assertEqual(stderr.getvalue(), "")
            for value in (
                "kapitbayan/backend",
                "kapitbayan/frontend",
                "10.20.0.0/16",
                "10.20.1.0/27",
                "synthetic-test-secret",
            ):
                self.assertNotIn(value, stdout.getvalue())

    def test_rejects_missing_network_parameters(self) -> None:
        for name in (
            "virtualNetworkAddressPrefix",
            "containerAppsSubnetAddressPrefix",
            "postgresSubnetAddressPrefix",
            "privateEndpointSubnetAddressPrefix",
        ):
            with self.subTest(parameter=name), tempfile.TemporaryDirectory() as directory:
                document = make_parameter_document()
                del document["parameters"][name]
                path = self.write_document(directory, document)
                with self.assertRaisesRegex(ValueError, name):
                    load_azure_pilot_parameters(path)

    def test_rejects_non_literal_network_parameter_values(self) -> None:
        invalid_entries = ({}, {"reference": {"keyVault": {"id": "secret"}}}, {"value": 7})
        for entry in invalid_entries:
            with self.subTest(entry=entry), tempfile.TemporaryDirectory() as directory:
                document = make_parameter_document()
                document["parameters"]["containerAppsSubnetAddressPrefix"] = entry
                path = self.write_document(directory, document)
                with self.assertRaisesRegex(ValueError, "containerAppsSubnetAddressPrefix"):
                    load_azure_pilot_parameters(path)

    def test_rejects_invalid_or_noncanonical_ipv4_cidr_values(self) -> None:
        for cidr in (
            "10.20.1.0",
            "10.20.1.1/27",
            "2001:db8::/64",
            "10.20/16",
            "10.20.1.0/33",
        ):
            with self.subTest(cidr=cidr), tempfile.TemporaryDirectory() as directory:
                path = self.write_document(directory, make_parameter_document(aca=cidr))
                with self.assertRaisesRegex(ValueError, "containerAppsSubnetAddressPrefix"):
                    load_azure_pilot_parameters(path)

    def test_rejects_subnet_outside_virtual_network(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_document(
                directory,
                make_parameter_document(postgres="10.21.2.0/28"),
            )
            with self.assertRaisesRegex(ValueError, "postgresSubnetAddressPrefix"):
                load_azure_pilot_parameters(path)

    def test_rejects_each_pair_of_overlapping_subnets(self) -> None:
        overlapping_ranges = (
            {"aca": "10.20.1.0/27", "postgres": "10.20.1.16/28"},
            {"aca": "10.20.1.0/27", "private_endpoint": "10.20.1.0/27"},
            {"postgres": "10.20.2.0/28", "private_endpoint": "10.20.2.8/29"},
        )
        for changes in overlapping_ranges:
            with self.subTest(changes=changes), tempfile.TemporaryDirectory() as directory:
                path = self.write_document(directory, make_parameter_document(**changes))
                with self.assertRaisesRegex(ValueError, "overlap"):
                    load_azure_pilot_parameters(path)

    def test_enforces_minimum_workload_profile_subnet_size(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_document(directory, make_parameter_document(aca="10.20.1.0/28"))
            with self.assertRaisesRegex(ValueError, "containerAppsSubnetAddressPrefix"):
                load_azure_pilot_parameters(path)

    def test_enforces_minimum_postgres_delegated_subnet_size(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_document(directory, make_parameter_document(postgres="10.20.2.0/29"))
            with self.assertRaisesRegex(ValueError, "postgresSubnetAddressPrefix"):
                load_azure_pilot_parameters(path)

    def test_rejects_all_documented_container_apps_reserved_ranges(self) -> None:
        reserved_ranges = (
            "169.254.0.0/16",
            "172.30.0.0/16",
            "172.31.0.0/16",
            "192.0.2.0/24",
            "100.100.0.0/17",
            "100.100.128.0/19",
            "100.100.160.0/19",
            "100.100.192.0/19",
        )
        for reserved in reserved_ranges:
            with self.subTest(reserved=reserved), tempfile.TemporaryDirectory() as directory:
                reserved_network = ipaddress.ip_network(reserved)
                aca_network = next(reserved_network.subnets(new_prefix=27))
                sibling_subnets = iter(
                    subnet
                    for subnet in reserved_network.subnets(new_prefix=28)
                    if not subnet.overlaps(aca_network)
                )
                postgres_network = next(sibling_subnets)
                private_endpoint_network = next(sibling_subnets)
                path = self.write_document(
                    directory,
                    make_parameter_document(
                        vnet=str(reserved_network),
                        aca=str(aca_network),
                        postgres=str(postgres_network),
                        private_endpoint=str(private_endpoint_network),
                    ),
                )
                with self.assertRaisesRegex(ValueError, "reserved"):
                    load_azure_pilot_parameters(path)

    def test_rejects_duplicate_json_keys(self) -> None:
        text = (
            '{"parameters":{"virtualNetworkAddressPrefix":{"value":"10.20.0.0/16"},'
            '"virtualNetworkAddressPrefix":{"value":"10.21.0.0/16"}}}'
        )
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, "duplicate"):
                load_azure_pilot_parameters(self.write_json(directory, text))

    def test_rejects_malformed_json_without_echoing_file_contents(self) -> None:
        secret = "synthetic-parameter-secret"
        text = f'{{"parameters": "{secret}"'
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError) as error:
                load_azure_pilot_parameters(self.write_json(directory, text))
            self.assertNotIn(secret, str(error.exception))

    def test_rejects_invalid_acr_repository_names_through_combined_check(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            document = make_parameter_document(backend_repository="PRIVATE/Backend")
            with self.assertRaisesRegex(ValueError, "acrBackendImageRepositoryName"):
                load_azure_pilot_parameters(self.write_document(directory, document))

    def test_cli_diagnostics_do_not_echo_parameter_values_or_other_secrets(self) -> None:
        bad_prefix = "sensitive-prefix-10.20.1.1/27"
        with tempfile.TemporaryDirectory() as directory:
            path = self.write_document(directory, make_parameter_document(aca=bad_prefix))
            stdout = io.StringIO()
            stderr = io.StringIO()
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                exit_code = main([str(path)])
            self.assertEqual(exit_code, 1)
            self.assertIn("containerAppsSubnetAddressPrefix", stderr.getvalue())
            self.assertNotIn(bad_prefix, stderr.getvalue())
            self.assertNotIn("synthetic-test-secret", stderr.getvalue())
            self.assertEqual(stdout.getvalue(), "")


if __name__ == "__main__":
    unittest.main()
