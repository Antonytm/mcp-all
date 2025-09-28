# Swiss-knife MCP server

It allows searching for the Model Context Protocol servers using MCP [registry](https://github.com/modelcontextprotocol/registry).

## Available tools

* `mcp_configuration` - shows current MCP configuration
* `search` - search for the MCP server using the index based on the MCP registry
* `add_mcp_server` - adds configuration for the MCP server
* `remove_mcp_server` - removes configuration for the MCP server
* `refresh_mcp_index` - refreshes the MCP index
* ... all other tools will be based on the added MCP servers

## Configuration

Sample configuration:
```
{
    "mcpServers": {
        "Universal MCP Server": {
            "command": "npx",
            "args": ["-y", "@antonytm/mcp-all@latest"],
            "transport": "stdio",
            "environmentVariables": [
                {
                    "name": "TRANSPORT",
                    "value": "stdio"
                }
            ]
        }
    }
}
```

It supports `stdio` and `streamable-http` transports.

## Release

Released as:
* [NPM package](https://www.npmjs.com/package/@antonytm/mcp-all)
* [Docker image](https://hub.docker.com/repository/docker/antonytm/mcp-all/general)
