import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import type { Config } from "../config";
import { MCPSearchIndex } from "../search-index";

export async function addSearchMcpTool(server: McpServer, config: Config, searchIndex: MCPSearchIndex) {
    server.tool(
        "search",   
        "Search for MCP servers",
        {
            query: z.string(),
            limit: z.number().optional().default(5),
        },
        async (params) => {
            const results = await searchIndex.search(params.query, params.limit);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2)
                    }
                ]
            };
        }
    );
}
