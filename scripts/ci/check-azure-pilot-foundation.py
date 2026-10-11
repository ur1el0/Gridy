#!/usr/bin/env python3
"""Check the compiled M49 ARM template's safety and scope contract."""

import json
import sys
from pathlib import Path
from typing import Any


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def walk_resources(resources: Any) -> list[dict[str, Any]]:
    if isinstance(resources, dict):
        resource_entries = resources.values()
    elif isinstance(resources, list):
        resource_entries = resources
    else:
        fail(f"expected nested resources to be an array or object, got {type(resources).__name__}")

    found: list[dict[str, Any]] = []
    for resource in resource_entries:
        if not isinstance(resource, dict):
            fail(f"expected a compiled resource object, got {type(resource).__name__}")
        found.append(resource)
        found.extend(walk_resources(resource.get("resources", [])))
    return found


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: check-azure-pilot-foundation.py COMPILED_TEMPLATE.json")

    template_path = Path(sys.argv[1])
    template = json.loads(template_path.read_text(encoding="utf-8"))
    schema = template.get("$schema", "")
    if not schema.endswith("/deploymentTemplate.json#"):
        fail(f"expected a resource-group deployment template schema, got {schema!r}")

    parameters = template.get("parameters", {})
    expected_parameters = {
        "location",
        "virtualNetworkName",
        "virtualNetworkAddressPrefix",
        "containerAppsSubnetName",
        "containerAppsSubnetAddressPrefix",
        "postgresSubnetName",
        "postgresSubnetAddressPrefix",
        "containerAppsWorkloadProfiles",
        "containerAppsZoneRedundant",
        "containerAppsEnvironmentName",
        "logAnalyticsWorkspaceName",
        "logAnalyticsSkuName",
        "logAnalyticsRetentionInDays",
        "postgresPrivateDnsZonePrefix",
        "postgresPrivateDnsLinkName",
        "postgresServerName",
        "postgresVersion",
        "postgresSku",
        "postgresAdministratorLogin",
        "postgresAdministratorPassword",
        "postgresBackup",
        "postgresHighAvailability",
        "postgresStorageSizeGb",
        "postgresStorageAutoGrow",
        "tags",
    }

    if parameters.keys() != expected_parameters:
        missing = expected_parameters - parameters.keys()
        unexpected = parameters.keys() - expected_parameters
        fail(f"parameter contract mismatch; missing={sorted(missing)}, unexpected={sorted(unexpected)}")
    with_defaults = sorted(
        name for name in expected_parameters if "defaultValue" in parameters[name]
    )
    if with_defaults:
        fail(f"deployment decisions have defaults: {with_defaults}")
    password_type = parameters["postgresAdministratorPassword"].get("type")
    if not isinstance(password_type, str) or password_type.casefold() != "securestring":
        fail(
            "PostgreSQL administrator password must compile to ARM type 'secureString'; "
            f"got {password_type!r}"
        )
    if template.get("outputs"):
        fail("the foundation template must not emit output values")

    resources = walk_resources(template.get("resources", []))
    resource_types = [resource.get("type", "").lower() for resource in resources]
    expected_types = {
        "microsoft.network/virtualnetworks",
        "microsoft.network/virtualnetworks/subnets",
        "microsoft.network/privatednszones",
        "microsoft.network/privatednszones/virtualnetworklinks",
        "microsoft.operationalinsights/workspaces",
        "microsoft.app/managedenvironments",
        "microsoft.dbforpostgresql/flexibleservers",
    }
    if set(resource_types) != expected_types:
        missing = expected_types - set(resource_types)
        unexpected = set(resource_types) - expected_types
        fail(f"resource scope mismatch; missing={sorted(missing)}, unexpected={sorted(unexpected)}")

    subnet_resources = [
        resource
        for resource in resources
        if resource.get("type", "").lower()
        == "microsoft.network/virtualnetworks/subnets"
    ]
    if len(subnet_resources) != 2:
        fail(f"expected two dedicated subnets, found {len(subnet_resources)}")
    subnet_delegations = [
        {
            delegation.get("properties", {}).get("serviceName")
            for delegation in resource.get("properties", {}).get("delegations", [])
        }
        for resource in subnet_resources
    ]
    expected_delegations = {
        "microsoft.app/environments",
        "microsoft.dbforpostgresql/flexibleservers",
    }
    flattened_delegations = set().union(*subnet_delegations)
    if flattened_delegations != expected_delegations:
        fail(f"subnet delegations differ from the expected ACA/PostgreSQL pair: {sorted(flattened_delegations)}")

    dns_zone = next(
        resource
        for resource in resources
        if resource.get("type", "").lower() == "microsoft.network/privatednszones"
    )
    if ".postgres.database.azure.com" not in dns_zone.get("name", ""):
        fail("PostgreSQL private DNS zone name is missing the required suffix")
    dns_link = next(
        resource
        for resource in resources
        if resource.get("type", "").lower()
        == "microsoft.network/privatednszones/virtualnetworklinks"
    )
    dns_link_properties = dns_link.get("properties", {})
    if dns_link_properties.get("registrationEnabled") is not False:
        fail("PostgreSQL private DNS VNet link must not enable auto-registration")
    if not dns_link_properties.get("virtualNetwork", {}).get("id"):
        fail("PostgreSQL private DNS VNet link has no VNet ID")

    postgres = next(
        resource
        for resource in resources
        if resource.get("type", "").lower()
        == "microsoft.dbforpostgresql/flexibleservers"
    )
    network = postgres.get("properties", {}).get("network", {})
    if not network.get("delegatedSubnetResourceId"):
        fail("PostgreSQL server is missing its delegated private subnet")
    if not network.get("privateDnsZoneArmResourceId"):
        fail("PostgreSQL server is missing its private DNS zone")
    if "publicNetworkAccess" in network:
        fail("VNet-integrated PostgreSQL must not set publicNetworkAccess")

    container_apps = next(
        resource
        for resource in resources
        if resource.get("type", "").lower() == "microsoft.app/managedenvironments"
    )
    aca_properties = container_apps.get("properties", {})
    if aca_properties.get("appLogsConfiguration", {}).get("destination") != "log-analytics":
        fail("Container Apps logs are not configured for Log Analytics")
    if not aca_properties.get("vnetConfiguration", {}).get("infrastructureSubnetId"):
        fail("Container Apps environment is missing the dedicated infrastructure subnet")

    forbidden_types = {
        "microsoft.app/containerapps",
        "microsoft.containerregistry/registries",
    }
    if forbidden_types.intersection(resource_types):
        fail("M49 must not create application apps or a container registry")

    print(
        "PASS: required parameters have no defaults; password is secure; "
        "private PostgreSQL/DNS and two delegated subnets are present; "
        "no outputs, app, or registry resources were compiled."
    )


if __name__ == "__main__":
    main()
