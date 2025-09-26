import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Config } from "../config.js";
import z from "zod";
import * as fs from "node:fs";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export async function removeMcpServer(server: McpServer, config: Config) {

    server.tool(
        "remove_mcp_server",
        "Remove an MCP server from the configuration",
        {
            serverName: z.string().describe("The name of the MCP server to remove"),
        },
        async (params) => {

            try {
                const configJson = await fs.promises.readFile(config.mcpConfigPath, 'utf8');
                const configJsonObject = JSON.parse(configJson);
                
                // Check if the server exists
                if (!configJsonObject.mcpServers || !configJsonObject.mcpServers[params.serverName]) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `MCP server '${params.serverName}' not found in configuration`
                            }
                        ]
                    };
                }

                // Remove the server from the configuration
                delete configJsonObject.mcpServers[params.serverName];

                // Test the configuration with the remaining servers
                const client = new MultiServerMCPClient({
                    // Global tool configuration options
                    throwOnLoadError: true,
                    prefixToolNameWithServerName: false,
                    additionalToolNamePrefix: "",
                    useStandardContentBlocks: true,
                    // Server configuration
                    mcpServers: configJsonObject.mcpServers
                });

                const tools = await client.getTools();
                
                // Write the updated configuration
                await fs.promises.writeFile(config.mcpConfigPath, JSON.stringify(configJsonObject, null, 2));
                
                return {
                    content: [
                        {
                            type: "text",
                            text: `MCP server '${params.serverName}' removed successfully. Please restart the server to apply changes. Remaining tools: ${tools.map((tool) => tool.name).join(", ")}`
                        }
                    ]
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error removing MCP server '${params.serverName}': ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }

        }
    );
}
