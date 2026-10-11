targetScope = 'resourceGroup'

@description('Azure region for every regional resource. Select only after the M42 region and data-location gates are approved.')
param location string

@description('Name of the virtual network.')
param virtualNetworkName string

@description('VNet address prefix. Must not overlap with connected networks or ACA reserved ranges.')
param virtualNetworkAddressPrefix string

@description('Name of the dedicated Container Apps infrastructure subnet.')
param containerAppsSubnetName string

@description('CIDR for the Container Apps workload-profile subnet. Microsoft documents /27 as the minimum; confirm headroom for the selected profiles.')
param containerAppsSubnetAddressPrefix string

@description('Name of the dedicated PostgreSQL Flexible Server subnet.')
param postgresSubnetName string

@description('CIDR for the dedicated PostgreSQL subnet. Azure documentation states /28 is the minimum; allow headroom for HA and future servers.')
param postgresSubnetAddressPrefix string

type ContainerAppsWorkloadProfile = {
  name: string
  workloadProfileType: string
  minimumCount: int
  maximumCount: int
}
@minLength(1)
@description('Required Container Apps workload profiles. Select profile types and min/max capacity supported by the chosen region and pilot budget.')
param containerAppsWorkloadProfiles ContainerAppsWorkloadProfile[]

@description('Whether the Container Apps environment should be zone redundant. Confirm regional support and cost before deployment.')
param containerAppsZoneRedundant bool

@description('Name of the Azure Container Apps managed environment.')
param containerAppsEnvironmentName string

@description('Name of the Log Analytics workspace receiving Container Apps logs.')
param logAnalyticsWorkspaceName string

@description('Log Analytics workspace SKU. Select a SKU available to the target subscription and region.')
param logAnalyticsSkuName string

@description('Workspace retention period in days. Must be valid for the selected workspace SKU.')
param logAnalyticsRetentionInDays int

@description('Prefix for the PostgreSQL private DNS zone. The template appends .postgres.database.azure.com; do not use the PostgreSQL server name as this prefix.')
param postgresPrivateDnsZonePrefix string

@description('Name of the private DNS virtual network link.')
param postgresPrivateDnsLinkName string

@description('Globally unique Azure Database for PostgreSQL Flexible Server name.')
param postgresServerName string

@description('PostgreSQL major version compatible with the source database and the selected Azure region.')
param postgresVersion string

type PostgreSqlSku = {
  name: string
  tier: 'Burstable' | 'GeneralPurpose' | 'MemoryOptimized'
}
@description('PostgreSQL compute SKU. The selected name/tier combination must be available in the chosen region.')
param postgresSku PostgreSqlSku

@description('PostgreSQL administrator login name. Use a non-production pilot credential.')
param postgresAdministratorLogin string

@secure()
@description('Required pilot-only PostgreSQL administrator password. Supply it through a secure deployment mechanism; never commit or output it.')
param postgresAdministratorPassword string

type PostgreSqlBackupSettings = {
  backupRetentionDays: int
  geoRedundantBackup: 'Enabled' | 'Disabled'
}
@description('Explicit PostgreSQL backup retention and geo-redundancy settings. Confirm region, cost, and RPO/RTO policy before deployment.')
param postgresBackup PostgreSqlBackupSettings

type PostgreSqlHighAvailabilitySettings = {
  mode: 'Disabled' | 'SameZone' | 'ZoneRedundant'
  standbyAvailabilityZone?: string
}
@description('Explicit PostgreSQL HA mode and optional standby zone. Confirm SKU, region availability, cost, and RPO/RTO requirements before deployment.')
param postgresHighAvailability PostgreSqlHighAvailabilitySettings

@description('PostgreSQL allocated storage in GiB. The requested size must be supported by the selected SKU.')
param postgresStorageSizeGb int

@description('PostgreSQL storage auto-grow policy.')
@allowed([
  'Enabled'
  'Disabled'
])
param postgresStorageAutoGrow string

@description('Resource tags required by the organization, including applicable owner and cost-center values.')
param tags object

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: virtualNetworkName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        virtualNetworkAddressPrefix
      ]
    }
  }
}

resource containerAppsSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = {
  parent: virtualNetwork
  name: containerAppsSubnetName
  properties: {
    addressPrefix: containerAppsSubnetAddressPrefix
    delegations: [
      {
        name: 'Microsoft.App/environments'
        properties: {
          serviceName: 'Microsoft.App/environments'
        }
      }
    ]
  }
}

resource postgresSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = {
  parent: virtualNetwork
  name: postgresSubnetName
  properties: {
    addressPrefix: postgresSubnetAddressPrefix
    delegations: [
      {
        name: 'Microsoft.DBforPostgreSQL/flexibleServers'
        properties: {
          serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
        }
      }
    ]
  }
}

resource postgresPrivateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: '${postgresPrivateDnsZonePrefix}.postgres.database.azure.com'
  location: 'global'
  tags: tags
}

resource postgresPrivateDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: postgresPrivateDnsZone
  name: postgresPrivateDnsLinkName
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: virtualNetwork.id
    }
  }
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    retentionInDays: logAnalyticsRetentionInDays
    sku: {
      name: logAnalyticsSkuName
    }
  }
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: containerAppsEnvironmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: containerAppsSubnet.id
      // M42's candidate topology places the same-origin frontend at the external edge.
      // This milestone creates no Container Apps or application ingress.
      internal: false
    }
    workloadProfiles: containerAppsWorkloadProfiles
    zoneRedundant: containerAppsZoneRedundant
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = {
  name: postgresServerName
  location: location
  tags: tags
  sku: {
    name: postgresSku.name
    tier: postgresSku.tier
  }
  properties: {
    administratorLogin: postgresAdministratorLogin
    administratorLoginPassword: postgresAdministratorPassword
    backup: {
      backupRetentionDays: postgresBackup.backupRetentionDays
      geoRedundantBackup: postgresBackup.geoRedundantBackup
    }
    highAvailability: postgresHighAvailability
    network: {
      delegatedSubnetResourceId: postgresSubnet.id
      privateDnsZoneArmResourceId: postgresPrivateDnsZone.id
    }
    storage: {
      autoGrow: postgresStorageAutoGrow
      storageSizeGB: postgresStorageSizeGb
    }
    version: postgresVersion
  }
}
