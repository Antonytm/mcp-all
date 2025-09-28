import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import type { Config } from "../config.js";

export async function addMcpConfigurationTool(server: McpServer, config: Config): Promise<void> {
    server.tool(
        "mcp configuration",
        "Get the MCP configuration",
        {},
        async () => {
            const configJson = await fs.promises.readFile(config.mcpConfigPath, 'utf8');
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(configJson, null, 2)
                    }
                ]
            };
        }
    );
}
