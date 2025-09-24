#!/usr/bin/env node

import { MCPRegistryClient, MCPSearchIndex, buildSearchIndex } from './build-search-index.js';

// Export the MCP registry client and search functionality
export { MCPRegistryClient, MCPSearchIndex, buildSearchIndex };

// Simple function to get list of MCP servers
export async function getMCPServers(): Promise<{servers: any[]}> {
    const client = new MCPRegistryClient();
    return await client.fetchAllServers();
}