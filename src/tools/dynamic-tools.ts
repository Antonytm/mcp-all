import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import type { Config } from "../config";
import { promises as fs } from "fs";

export async function registeryDynamicTools(server: McpServer, config: Config) {
    
    try {
        const configJson = await fs.readFile(config.mcpConfigPath, 'utf8');
        const configJsonObject = JSON.parse(configJson);
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

        for (const tool of tools) {
            const name = tool.name;
            const description = tool.description;
            const args = tool.schema;

            // Convert LangChain tool schema to MCP server tool format
            const mcpArgs = convertSchemaToMCPArgs(args);

            // Register the tool with the MCP server
            server.tool(
                name,
                description,
                mcpArgs,
                async (params) => {
                    try {
                        // Call the original LangChain tool
                        const result = await tool.invoke(params);

                        // Convert result to MCP format
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                                }
                            ]
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
                                }
                            ]
                        };
                    }
                }
            );
        }

        return tools;
    }
    catch (error) {
        console.error('Error registering dynamic tools:', error);
    }
}

/**
 * Convert LangChain tool schema to MCP server argument format
 */
function convertSchemaToMCPArgs(schema: any): Record<string, z.ZodTypeAny> {
    const mcpArgs: Record<string, z.ZodTypeAny> = {};

    if (schema && schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
            const propSchema = prop as any;

            // Convert JSON Schema to Zod schema
            if (propSchema.type === 'string') {
                mcpArgs[key] = z.string();
            } else if (propSchema.type === 'number') {
                mcpArgs[key] = z.number();
            } else if (propSchema.type === 'boolean') {
                mcpArgs[key] = z.boolean();
            } else if (propSchema.type === 'array') {
                mcpArgs[key] = z.array(z.any());
            } else if (propSchema.type === 'object') {
                mcpArgs[key] = z.object({});
            } else {
                mcpArgs[key] = z.any();
            }

            // Handle optional properties
            if (schema.required && !schema.required.includes(key)) {
                mcpArgs[key] = mcpArgs[key].optional();
            }
        }
    }

    return mcpArgs;
}
