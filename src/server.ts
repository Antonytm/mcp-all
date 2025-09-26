import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "node:process";
import z from "zod";
import type { Config } from "./config.js";
import { MCPSearchIndex, buildSearchIndex } from "./search-index.js";
import * as fs from "fs";
import * as path from "path";
import { registeryDynamicTools } from "./tools/dynamic-tools.js";
import { addMcpServer } from "./tools/add-mcp-server.js";
import { removeMcpServer } from "./tools/remove-mcp-server.js";
import { addMcpConfigurationTool } from "./tools/mcp-configuration.js";
import { refreshMcpIndex } from "./tools/refresh-mcp-index.js";

export async function getServer(config: Config): Promise<McpServer> {
    const server = new McpServer({
        name: `Universal MCP Server`,
        description: "Model Context Protocol Server for using all MCP servers",
        version: "0.1.8",
    });

    // Initialize search index
    const searchIndex = new MCPSearchIndex();
    
    // Try to load existing search index from file, or build it if it doesn't exist
    if (fs.existsSync(config.indexPath)) {
        try {
            await searchIndex.importFromFile(config.indexPath);
            console.log('✅ Loaded existing search index');
        } catch (error) {
            console.error('⚠️ Could not load existing search index, building new one:', error);
            await buildSearchIndex();
            await searchIndex.importFromFile(config.indexPath);
        }
    } else {
        console.log('ℹ️ No existing search index found, building new index...');
        await buildSearchIndex();
        await searchIndex.importFromFile(config.indexPath);
    }

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

    await addMcpConfigurationTool(server, config);

    await addMcpServer(server, config);
    await removeMcpServer(server, config);
    await refreshMcpIndex(server, config);
    await registeryDynamicTools(server, config);

    return server;
}