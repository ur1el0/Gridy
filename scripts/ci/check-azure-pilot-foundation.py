#!/usr/bin/env python3
"""Check the compiled Azure pilot ARM template's safety and scope contract."""

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def walk_resources(resources: Any) -> list[dict[str, Any]]:
    if isinstance(resources, dict):
        entries = resources.values()
    elif isinstance(resources, list):
        entries = resources
    else:
        fail(f"expected nested resources as array or object, got {type(resources).__name__}")

    found: list[dict[str, Any]] = []
    for resource in entries:
        if not isinstance(resource, dict):
            fail(f"expected compiled resource object, got {type(resource).__name__}")
        found.append(resource)
        found.extend(walk_resources(resource.get("resources", [])))
    return found


def normalized_type(resource: dict[str, Any]) -> str:
    value = resource.get("type")
    if not isinstance(value, str):
        fail(f"resource has no string type: {resource!r}")
    return value.casefold()


def arm_expression(value: Any) -> str:
    return value if isinstance(value, str) else ""


def expand_variables(value: Any, variables: Any) -> str:
    expression = arm_expression(value)
    if not isinstance(variables, dict):
        return expression
    for name, variable_value in variables.items():
        if isinstance(name, str) and isinstance(variable_value, str):
            expression = expression.replace(f"variables('{name}')", variable_value)
    return expression


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: check-azure-pilot-foundation.py COMPILED_TEMPLATE.json")

    template = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    schema = template.get("$schema", "")
    if not isinstance(schema, str) or not schema.endswith("/deploymentTemplate.json#"):
        fail(f"expected a resource-group deployment template schema, got {schema!r}")

    parameters = template.get("parameters")
    if not isinstance(parameters, dict):
        fail("compiled ARM template has no parameter object")
    expected_parameters = {
        "location",
        "virtualNetworkName",
        "virtualNetworkAddressPrefix",
        "containerAppsSubnetName",
        "containerAppsSubnetAddressPrefix",
        "postgresSubnetName",
        "postgresSubnetAddressPrefix",
        "privateEndpointSubnetName",
        "privateEndpointSubnetAddressPrefix",
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
        "acrRegistryName",
        "acrSkuName",
        "acrPrivateEndpointName",
        "acrPrivateDnsLinkName",
        "acrImagePullIdentityName",
        "keyVaultName",
        "keyVaultTenantId",
        "keyVaultPrivateEndpointName",
        "keyVaultPrivateDnsLinkName",
        "keyVaultSoftDeleteRetentionInDays",
        "backendRuntimeIdentityName",
    }
    if parameters.keys() != expected_parameters:
        missing = expected_parameters - parameters.keys()
        unexpected = parameters.keys() - expected_parameters
        fail(
            f"parameter contract mismatch; missing={sorted(missing)}, "
            f"unexpected={sorted(unexpected)}"
        )

    malformed_parameters = sorted(
        name for name, value in parameters.items() if not isinstance(value, dict)
    )
    if malformed_parameters:
        fail(f"parameter declarations have invalid shapes: {malformed_parameters}")
    with_defaults = sorted(name for name, value in parameters.items() if "defaultValue" in value)
    if with_defaults:
        fail(f"deployment parameters have defaults: {with_defaults}")
    password_type = parameters["postgresAdministratorPassword"].get("type")
    if not isinstance(password_type, str) or password_type.casefold() != "securestring":
        fail(f"PostgreSQL administrator password must be secureString, got {password_type!r}")
    if parameters["acrSkuName"].get("allowedValues") != ["Premium"]:
        fail("ACR SKU parameter must be constrained to Premium for Private Link")
    retention = parameters["keyVaultSoftDeleteRetentionInDays"]
    if retention.get("minValue") != 7 or retention.get("maxValue") != 90:
        fail("Key Vault soft-delete retention parameter must be constrained to 7–90 days")
    if template.get("outputs"):
        fail("foundation template must not emit output values")

    variables = template.get("variables", {})

    resources = walk_resources(template.get("resources", []))
    type_counts = Counter(normalized_type(resource) for resource in resources)
    expected_counts = Counter(
        {
            "microsoft.network/virtualnetworks": 1,
            "microsoft.network/virtualnetworks/subnets": 3,
            "microsoft.network/privatednszones": 3,
            "microsoft.network/privatednszones/virtualnetworklinks": 3,
            "microsoft.network/privateendpoints": 2,
            "microsoft.network/privateendpoints/privatednszonegroups": 2,
            "microsoft.operationalinsights/workspaces": 1,
            "microsoft.app/managedenvironments": 1,
            "microsoft.dbforpostgresql/flexibleservers": 1,
            "microsoft.containerregistry/registries": 1,
            "microsoft.keyvault/vaults": 1,
            "microsoft.managedidentity/userassignedidentities": 2,
            "microsoft.authorization/roleassignments": 2,
        }
    )
    if type_counts != expected_counts:
        fail(
            "resource scope/count mismatch; "
            f"missing={expected_counts - type_counts}, unexpected={type_counts - expected_counts}"
        )

    by_type: dict[str, list[dict[str, Any]]] = {}
    for resource in resources:
        by_type.setdefault(normalized_type(resource), []).append(resource)

    subnets = by_type["microsoft.network/virtualnetworks/subnets"]
    delegated_services = []
    endpoint_subnets = []
    for subnet in subnets:
        properties = subnet.get("properties", {})
        delegations = properties.get("delegations", [])
        if not isinstance(delegations, list):
            fail("subnet delegations must compile as an array")
        delegated_services.append(
            {
                str(item.get("properties", {}).get("serviceName", "")).casefold()
                for item in delegations
                if isinstance(item, dict)
            }
        )
        if properties.get("privateEndpointNetworkPolicies") == "Disabled":
            endpoint_subnets.append(subnet)
    flattened = set().union(*delegated_services)
    expected_delegations = {
        "microsoft.app/environments",
        "microsoft.dbforpostgresql/flexibleservers",
    }
    if flattened != expected_delegations:
        fail(f"only ACA/PostgreSQL subnet delegations are allowed; got {sorted(flattened)}")
    if len(endpoint_subnets) != 1:
        fail(
            "expected exactly one private-endpoint subnet with policies disabled, "
            f"found {len(endpoint_subnets)}"
        )
    if endpoint_subnets[0].get("properties", {}).get("delegations") != []:
        fail("private-endpoint subnet must not be delegated")

    zones = {
        resource.get("name"): resource
        for resource in by_type["microsoft.network/privatednszones"]
    }
    required_zones = (
        "privatelink.azurecr.io",
        "privatelink.vaultcore.azure.net",
    )
    for required_zone in required_zones:
        if required_zone not in zones:
            fail(f"missing private DNS zone {required_zone!r}")
    postgres_zone = next(
        (
            resource
            for resource in by_type["microsoft.network/privatednszones"]
            if ".postgres.database.azure.com" in arm_expression(resource.get("name"))
        ),
        None,
    )
    if postgres_zone is None:
        fail("missing PostgreSQL private DNS zone suffix")

    postgres = by_type["microsoft.dbforpostgresql/flexibleservers"][0]
    postgres_network = postgres.get("properties", {}).get("network", {})
    if not postgres_network.get("delegatedSubnetResourceId"):
        fail("PostgreSQL server is missing its delegated private subnet")
    if not postgres_network.get("privateDnsZoneArmResourceId"):
        fail("PostgreSQL server is missing its private DNS zone")
    if "publicNetworkAccess" in postgres_network:
        fail("VNet-integrated PostgreSQL must not set publicNetworkAccess")

    container_apps = by_type["microsoft.app/managedenvironments"][0]
    aca_properties = container_apps.get("properties", {})
    if aca_properties.get("appLogsConfiguration", {}).get("destination") != "log-analytics":
        fail("Container Apps logs are not configured for Log Analytics")
    if not aca_properties.get("vnetConfiguration", {}).get("infrastructureSubnetId"):
        fail("Container Apps environment is missing the dedicated infrastructure subnet")

    dns_links = by_type["microsoft.network/privatednszones/virtualnetworklinks"]
    for link in dns_links:
        props = link.get("properties", {})
        if props.get("registrationEnabled") is not False:
            fail(f"private DNS link {link.get('name')!r} must disable auto-registration")
        if not arm_expression(props.get("virtualNetwork", {}).get("id")):
            fail(f"private DNS link {link.get('name')!r} has no VNet reference")
    for required_zone in required_zones:
        if not any(
            required_zone in arm_expression(link.get("name")).casefold()
            for link in dns_links
        ):
            fail(f"private DNS zone {required_zone!r} has no VNet link")

    acr = by_type["microsoft.containerregistry/registries"][0]
    acr_properties = acr.get("properties", {})
    if acr.get("name") != "[parameters('acrRegistryName')]":
        fail("ACR name must use the required registry-name parameter")
    if acr.get("sku", {}).get("name") != "[parameters('acrSkuName')]":
        fail("registry SKU must use the required Premium parameter")
    if acr_properties.get("adminUserEnabled") is not False:
        fail("ACR admin user must be disabled")
    if acr_properties.get("anonymousPullEnabled") is not False:
        fail("ACR anonymous pull must be disabled")
    if acr_properties.get("networkRuleBypassOptions") != "None":
        fail("ACR trusted-service network bypass must be disabled")
    if acr_properties.get("publicNetworkAccess") != "Disabled":
        fail("ACR public network access must be disabled")
    if acr_properties.get("roleAssignmentMode") != "AbacRepositoryPermissions":
        fail("ACR must explicitly use ABAC repository-permissions mode")

    vault = by_type["microsoft.keyvault/vaults"][0]
    vault_properties = vault.get("properties", {})
    if vault.get("name") != "[parameters('keyVaultName')]":
        fail("Key Vault name must use the required vault-name parameter")
    if vault_properties.get("tenantId") != "[parameters('keyVaultTenantId')]":
        fail("Key Vault must use the required tenant ID parameter")
    if vault_properties.get("sku", {}).get("name") != "standard":
        fail("Key Vault must use Standard SKU for this secrets-only foundation")
    if vault_properties.get("enableRbacAuthorization") is not True:
        fail("Key Vault data access must use Azure RBAC")
    if vault_properties.get("enableSoftDelete") is not True:
        fail("Key Vault soft delete must be enabled explicitly")
    if vault_properties.get("enablePurgeProtection") is not True:
        fail("Key Vault purge protection must be enabled")
    if vault_properties.get("softDeleteRetentionInDays") != (
        "[parameters('keyVaultSoftDeleteRetentionInDays')]"
    ):
        fail("Key Vault must use the bounded retention parameter")
    if vault_properties.get("publicNetworkAccess") != "Disabled":
        fail("Key Vault public network access must be disabled")
    if "networkAcls" in vault_properties:
        fail(
            "Key Vault firewall bypass/network rules are outside this reviewed "
            "private-endpoint contract"
        )

    identities = by_type["microsoft.managedidentity/userassignedidentities"]
    expected_identities = {
        "acrImagePullIdentityName",
        "backendRuntimeIdentityName",
    }
    observed_identity_parameters: set[str] = set()
    for identity in identities:
        name_expression = arm_expression(identity.get("name"))
        parameter_name = next(
            (name for name in expected_identities if f"parameters('{name}')" in name_expression),
            None,
        )
        if parameter_name is None or parameter_name in observed_identity_parameters:
            fail(f"identity has an unexpected or duplicate name parameter: {name_expression!r}")
        observed_identity_parameters.add(parameter_name)
        if identity.get("location") != "[parameters('location')]":
            fail(f"identity {parameter_name} must use the required location parameter")
        if identity.get("tags") != "[parameters('tags')]":
            fail(f"identity {parameter_name} must use the required tags parameter")
    if observed_identity_parameters != expected_identities:
        fail(f"managed identity coverage mismatch: {sorted(observed_identity_parameters)}")

    # Built-in role IDs are stable Azure role-definition IDs. Keep these explicit
    # so the checker can verify both the permission and the intended identity.
    role_contracts = {
        "b93aa761-3e63-49ed-ac28-beffa264f7ac": {
            "scope_type": "microsoft.containerregistry/registries",
            "scope_parameter": "acrRegistryName",
            "identity_symbol": "acrImagePullIdentity",
        },
        "4633458b-17de-408a-b874-0445c86b69e6": {
            "scope_type": "microsoft.keyvault/vaults",
            "scope_parameter": "keyVaultName",
            "identity_symbol": "backendRuntimeIdentity",
        },
    }
    observed_roles: set[str] = set()
    for assignment in by_type["microsoft.authorization/roleassignments"]:
        properties = assignment.get("properties", {})
        role_definition = expand_variables(
            properties.get("roleDefinitionId"), variables
        ).casefold()
        role_id = next((role for role in role_contracts if role in role_definition), None)
        if role_id is None or role_id in observed_roles:
            fail(f"role assignment has an unexpected or duplicate built-in role: {role_definition!r}")
        observed_roles.add(role_id)
        contract = role_contracts[role_id]
        if properties.get("principalType") != "ServicePrincipal":
            fail(f"role {role_id} must be assigned to a managed-identity service principal")
        principal = arm_expression(properties.get("principalId")).casefold()
        expected_principal = (
            f"[reference('{contract['identity_symbol']}').principalId]".casefold()
        )
        if principal != expected_principal:
            fail(
                f"role {role_id} principal must resolve from "
                f"{contract['identity_symbol']}; got {principal!r}"
            )
        scope = arm_expression(assignment.get("scope")).casefold()
        if contract["scope_type"] not in scope or contract["scope_parameter"].casefold() not in scope:
            fail(f"role {role_id} must be scoped to {contract['scope_type']} resource")
        if "guid(" not in arm_expression(assignment.get("name")).casefold():
            fail(f"role {role_id} assignment name must be deterministic")
        if "condition" in properties or "delegatedManagedIdentityResourceId" in properties:
            fail(f"role {role_id} contains an unreviewed condition or delegation")
    if observed_roles != set(role_contracts):
        fail(f"role assignment coverage mismatch: {sorted(observed_roles)}")

    endpoint_contracts = {
        "microsoft.containerregistry/registries": (
            "registry",
            "acrRegistryName",
            "acrPrivateEndpointName",
        ),
        "microsoft.keyvault/vaults": ("vault", "keyVaultName", "keyVaultPrivateEndpointName"),
    }
    matched_endpoint_targets: set[str] = set()
    for endpoint in by_type["microsoft.network/privateendpoints"]:
        props = endpoint.get("properties", {})
        subnet_id = arm_expression(props.get("subnet", {}).get("id"))
        if "privateEndpointSubnetName".casefold() not in subnet_id.casefold():
            fail(
                f"endpoint {endpoint.get('name')!r} must use the dedicated "
                "private-endpoint subnet"
            )
        connections = props.get("privateLinkServiceConnections", [])
        if not isinstance(connections, list) or len(connections) != 1:
            fail(f"endpoint {endpoint.get('name')!r} must have exactly one private-link connection")
        connection_props = connections[0].get("properties", {})
        target_id = arm_expression(connection_props.get("privateLinkServiceId")).casefold()
        group_ids = connection_props.get("groupIds", [])
        matched = False
        endpoint_name = arm_expression(endpoint.get("name")).casefold()
        for resource_type, (
            group_id,
            target_parameter,
            endpoint_parameter,
        ) in endpoint_contracts.items():
            if resource_type in target_id and target_parameter.casefold() in target_id:
                if group_ids != [group_id]:
                    fail(f"{resource_type} endpoint must use group ID {group_id!r}")
                if endpoint_parameter.casefold() not in endpoint_name:
                    fail(f"{resource_type} endpoint must use parameter {endpoint_parameter!r}")
                matched_endpoint_targets.add(resource_type)
                matched = True
                break
        if not matched:
            fail(f"endpoint {endpoint.get('name')!r} targets an unexpected resource or subresource")
    if matched_endpoint_targets != set(endpoint_contracts):
        fail(f"private endpoint target coverage is incomplete: {sorted(matched_endpoint_targets)}")

    groups = by_type["microsoft.network/privateendpoints/privatednszonegroups"]
    group_zone_targets: set[str] = set()
    for group in groups:
        group_name = arm_expression(group.get("name")).casefold()
        props = group.get("properties", {})
        configs = props.get("privateDnsZoneConfigs", [])
        if not isinstance(configs, list) or len(configs) != 1:
            fail(f"zone group {group_name!r} must contain exactly one zone config")
        zone_id = arm_expression(
            configs[0].get("properties", {}).get("privateDnsZoneId")
        ).casefold()
        if "privatelink.azurecr.io" in zone_id:
            group_zone_targets.add("acr")
            if "acrprivateendpointname" not in group_name:
                fail("ACR private DNS group must be attached to the ACR endpoint")
        elif "privatelink.vaultcore.azure.net" in zone_id:
            group_zone_targets.add("keyvault")
            if "keyvaultprivateendpointname" not in group_name:
                fail("Key Vault private DNS group must be attached to the Key Vault endpoint")
        else:
            fail(f"zone group {group_name!r} references an unexpected private DNS zone")
    if group_zone_targets != {"acr", "keyvault"}:
        fail(f"private DNS zone groups do not cover both services: {sorted(group_zone_targets)}")

    forbidden_types = {
        "microsoft.app/containerapps",
        "microsoft.keyvault/vaults/secrets",
        "microsoft.managedidentity/userassignedidentities/federatedidentitycredentials",
        "microsoft.containerregistry/registries/tasks",
        "microsoft.containerregistry/registries/replications",
    }
    if forbidden_types.intersection(type_counts):
        fail(f"out-of-scope resources found: {sorted(forbidden_types.intersection(type_counts))}")
    print(
        "PASS: required parameters, private ACR/Key Vault, separate managed identities, "
        "exactly scoped read roles, private endpoints/DNS, and no-app/no-secret/no-output "
        "boundary verified."
    )


if __name__ == "__main__":
    main()
