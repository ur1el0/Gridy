#!/usr/bin/env python3
"""Validate safe offline constraints in an Azure pilot ARM parameter file."""

from __future__ import annotations

import argparse
import ipaddress
import sys
from pathlib import Path
from typing import Any

from check_acr_repository_parameters import (
    PreflightError,
    get_literal_string_parameter,
    read_parameter_document,
    validate_repository_parameters,
)

NETWORK_PARAMETERS = {
    "vnet": "virtualNetworkAddressPrefix",
    "container_apps": "containerAppsSubnetAddressPrefix",
    "postgres": "postgresSubnetAddressPrefix",
    "private_endpoint": "privateEndpointSubnetAddressPrefix",
}

# Current workload-profile Container Apps networking documentation lists these
# ranges as reserved for the environment's workload subnet.
CONTAINER_APPS_RESERVED_RANGES = (
    "169.254.0.0/16",
    "172.30.0.0/16",
    "172.31.0.0/16",
    "192.0.2.0/24",
    "100.100.0.0/17",
    "100.100.128.0/19",
    "100.100.160.0/19",
    "100.100.192.0/19",
)


def _read_ipv4_network(parameters: dict[str, Any], parameter_name: str) -> ipaddress.IPv4Network:
    value = get_literal_string_parameter(parameters, parameter_name)
    if "/" not in value:
        raise PreflightError(f"{parameter_name} must use CIDR notation")
    try:
        network = ipaddress.ip_network(value, strict=True)
    except ValueError as error:
        raise PreflightError(f"{parameter_name} must be a strict IPv4 CIDR network") from error

    if not isinstance(network, ipaddress.IPv4Network):
        raise PreflightError(f"{parameter_name} must be an IPv4 CIDR network")
    if str(network) != value:
        raise PreflightError(f"{parameter_name} must use canonical IPv4 CIDR notation")
    return network


def validate_network_parameters(parameters: dict[str, Any]) -> None:
    """Validate VNet and subnet structure without printing supplied ranges."""
    networks = {
        key: _read_ipv4_network(parameters, parameter_name)
        for key, parameter_name in NETWORK_PARAMETERS.items()
    }
    vnet = networks["vnet"]
    subnets = [(key, networks[key]) for key in NETWORK_PARAMETERS if key != "vnet"]

    for key, subnet in subnets:
        parameter_name = NETWORK_PARAMETERS[key]
        if not subnet.subnet_of(vnet):
            raise PreflightError(f"{parameter_name} must be contained within {NETWORK_PARAMETERS['vnet']}")

    for index, (left_key, left_network) in enumerate(subnets):
        for right_key, right_network in subnets[index + 1 :]:
            if left_network.overlaps(right_network):
                raise PreflightError(
                    f"{NETWORK_PARAMETERS[left_key]} and {NETWORK_PARAMETERS[right_key]} must not overlap"
                )

    aca = networks["container_apps"]
    if aca.prefixlen > 27:
        raise PreflightError(
            f"{NETWORK_PARAMETERS['container_apps']} must provide at least a /27 network"
        )

    postgres = networks["postgres"]
    if postgres.prefixlen > 28:
        raise PreflightError(
            f"{NETWORK_PARAMETERS['postgres']} must provide at least a /28 network"
        )

    for reserved_cidr in CONTAINER_APPS_RESERVED_RANGES:
        if aca.overlaps(ipaddress.ip_network(reserved_cidr)):
            raise PreflightError(
                f"{NETWORK_PARAMETERS['container_apps']} overlaps a documented Container Apps reserved range"
            )


def load_azure_pilot_parameters(path: Path) -> None:
    """Load once, then validate M54 repository values and M55 network values."""
    document = read_parameter_document(path)
    validate_repository_parameters(document)
    parameter_values = document.get("parameters")
    if not isinstance(parameter_values, dict):
        raise PreflightError("Parameter file must contain a parameters object")
    validate_network_parameters(parameter_values)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Check ACR repository and VNet/subnet values in an ARM JSON parameter file."
    )
    parser.add_argument(
        "parameters_file",
        type=Path,
        help="ARM JSON deployment parameter file to validate",
    )
    arguments = parser.parse_args(argv)

    try:
        load_azure_pilot_parameters(arguments.parameters_file)
    except PreflightError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("PASS: ACR repository names and documented VNet/subnet constraints are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
