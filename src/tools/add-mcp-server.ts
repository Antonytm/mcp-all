import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Config } from "../config.js";
import z from "zod";
import * as fs from "node:fs";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export async function addMcpServer(server: McpServer, config: Config) {

    const configJson = await fs.promises.readFile(config.mcpConfigPath, 'utf8');

    server.tool(
        "add_mcp_server",
        "Add a new MCP server to the configuration",
        {
            mcpServer: z.object({
                name: z.string(),
                description: z.string(),
                command: z.string().optional(),
                args: z.array(z.string()).optional(),
                url: z.string().optional(),
                headers: z.record(z.string(), z.string()).optional(),
                automaticSSEFallback: z.boolean().optional(),
                transport: z.enum(["stdio", "streamable-http", "sse"]).optional(),
                reconnect: z.object({
                    enabled: z.boolean(),
                }).optional(),
            }),
        },
        async (params) => {

            try {
                const configJson = await fs.promises.readFile(config.mcpConfigPath, 'utf8');
                const configJsonObject = JSON.parse(configJson);
                configJsonObject.mcpServers = {
                    ...configJsonObject.mcpServers,
                    [params.mcpServer.name]: params.mcpServer,
                };
                const client = new MultiServerMCPClient({
                    // Global tool configuration options
                    // Whether to throw on errors if a tool fails to load (optional, default: true)
                    throwOnLoadError: true,
                    // Whether to prefix tool names with the server name (optional, default: false)
                    prefixToolNameWithServerName: false,
                    // Optional additional prefix for tool names (optional, default: "")
                    additionalToolNamePrefix: "",

                    // Use standardized content block format in tool outputs
                    useStandardContentBlocks: true,

                    // Server configuration
                    mcpServers: configJsonObject.mcpServers
                });

                const tools = await client.getTools();
                if(tools.length > 0) {
                    await fs.promises.writeFile(config.mcpConfigPath, JSON.stringify(configJsonObject, null, 2));
                    return {
                        content: [
                            {
                                type: "text",
                                text: "MCP server added successfully. Please restart the server to use the new MCP tools: " + tools.map((tool) => tool.name).join(", ")
                            }
                        ]
                    };
                }

                
                return {
                    content: [
                        {
                            type: "text",
                            text: "Error adding MCP server"
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Error adding MCP server"
                        }
                    ]
                };
            }

        }
    );
}
