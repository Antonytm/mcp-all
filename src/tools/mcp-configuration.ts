import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import type { Config } from "../config.js";

export async function addMcpConfigurationTool(server: McpServer, config: Config): Promise<void> {
    server.tool(
        "mcp configuration",
        "Get the MCP configuration",
        {},
        async () => {
            if (!fs.existsSync(config.mcpConfigPath)) {
                {
                    await fs.promises.writeFile(config.mcpConfigPath, JSON.stringify({
                        mcpServers: {}
                    }, null, 2));
                }
            }
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
