import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Config } from "../config.js";
import { buildSearchIndex } from "../build-search-index.js";

export async function refreshMcpIndex(server: McpServer, config: Config): Promise<void> {
    server.tool(
        "refresh_mcp_index",
        "Refresh the MCP search index by rebuilding it from the registry",
        {},
        async () => {
            try {
                console.log('🔄 Starting MCP search index refresh...');
                await buildSearchIndex();
                
                return {
                    content: [
                        {
                            type: "text",
                            text: "✅ MCP search index has been successfully refreshed! The index has been rebuilt from the latest registry data."
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ Error refreshing MCP search index: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    );
}
