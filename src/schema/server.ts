export interface Server {
    $schema: string
    _meta: Meta
    description: string
    name: string
    packages: Package[]
    remotes: Remote[]
    repository: Repository
    status: string
    version: string
    websiteUrl: string
  }
  
  export interface Meta {
    "io.modelcontextprotocol.registry/official": IoModelcontextprotocolRegistryOfficial
    "io.modelcontextprotocol.registry/publisher-provided": IoModelcontextprotocolRegistryPublisherProvided
  }
  
  export interface IoModelcontextprotocolRegistryOfficial {
    isLatest: boolean
    publishedAt: string
    serverId: string
    updatedAt: string
    versionId: string
  }
  
  export interface IoModelcontextprotocolRegistryPublisherProvided {
    property1: any
    property2: any
  }
  
  export interface Package {
    environmentVariables: EnvironmentVariable[]
    fileSha256: string
    identifier: string
    packageArguments: PackageArgument[]
    registryBaseUrl: string
    registryType: string
    runtimeArguments: RuntimeArgument[]
    runtimeHint: string
    transport: Transport
    version: string
  }
  
  export interface EnvironmentVariable {}
  
  export interface PackageArgument {}
  
  export interface RuntimeArgument {}
  
  export interface Transport {
    headers: any[]
  }
  
  export interface Remote {
    headers: Header[]
    type: string
    url: string
  }
  
  export interface Header {}
  
  export interface Repository {
    id: string
    source: string
    subfolder: string
    url: string
  }
  