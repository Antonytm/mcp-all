// This file is used to build the search index of the MCP servers.
// It will use https://registry.modelcontextprotocol.io/api/servers to get the MCP servers and then build the search index.
// The search index will be used to search the MCP servers by name, description, and tags.

import flexsearch from 'flexsearch';
const { Index } = flexsearch;
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import type { Server } from './schema/server.js';
import type { Metadata } from './schema/metadata.js';
import { config } from './config.js';

class MCPRegistryClient {
    baseUrl = 'https://registry.modelcontextprotocol.io';

    async fetchAllServers(): Promise<{ servers: Server[], metadata: Metadata }> {
        console.log('🔍 Fetching MCP servers from registry...');

        try {
            let allServers: Server[] = [];
            let cursor: string | null = null;
            let totalFetched = 0;
            let pageCount = 0;

            do {
                pageCount++;
                console.log(`📄 Fetching page ${pageCount}${cursor ? ` (cursor: ${cursor})` : ''}...`);
                
                const url = cursor 
                    ? `${this.baseUrl}/v0/servers?cursor=${encodeURIComponent(cursor)}`
                    : `${this.baseUrl}/v0/servers`;
                
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json() as { servers: Server[], metadata: Metadata };
                
                allServers = allServers.concat(data.servers);
                totalFetched += data.servers.length;
                cursor = data.metadata.next_cursor;
                
                console.log(`✅ Retrieved ${data.servers.length} servers from page ${pageCount} (total: ${totalFetched})`);
                
                // Safety check to prevent infinite loops
                if (pageCount > 100) {
                    console.warn('⚠️  Reached maximum page limit (100), stopping pagination');
                    break;
                }
                
            } while (cursor && cursor.trim() !== '');

            console.log(`🎯 Total servers fetched: ${totalFetched} across ${pageCount} pages`);
            
            return { 
                servers: allServers, 
                metadata: { 
                    count: totalFetched, 
                    next_cursor: '' // No more pages
                } 
            };
        } catch (error) {
            console.error('❌ Error fetching servers from API:', error);
            throw error;
        }
    }
}

class MCPSearchIndex {
    index: any;
    servers = new Map();

    constructor() {
        // Configure FlexSearch for optimal MCP server searching
        this.index = new Index({
            preset: 'match',
            tokenize: 'forward',
            resolution: 9,
            optimize: true,
            cache: true
        });
    }

    addServer(server: Server) {
        // Store the full server data
        this.servers.set(server._meta['io.modelcontextprotocol.registry/official'].serverId || server.name, server);

        // Create searchable content combining all relevant fields
        const searchContent = [
            server.name,
            server.description,
        ].filter(Boolean).join(' ');

        // Add to FlexSearch index
        this.index.add(server._meta['io.modelcontextprotocol.registry/official'].serverId || server.name, searchContent);
    }

    search(query: string, limit: number = 10) {
        const results = this.index.search(query, { limit });
        return results.map((id: string) => this.servers.get(id)).filter(Boolean);
    }

    getAllServers() {
        return Array.from(this.servers.values());
    }

    getServerCount() {
        return this.servers.size;
    }

    async exportIndex() {
        return new Promise((resolve) => {
            this.index.export((key: string, data: any) => {
                resolve({
                    indexData: { [key]: data },
                    servers: Object.fromEntries(this.servers),
                    metadata: {
                        totalServers: this.getServerCount(),
                        buildDate: new Date().toISOString(),
                        version: '1.0.0'
                    }
                });
            });
        });
    }

    async importFromJSON(jsonData: any) {
        try {
            // Validate the JSON structure
            if (!jsonData || typeof jsonData !== 'object') {
                throw new Error('Invalid JSON data: must be an object');
            }

            if (!jsonData.indexData || !jsonData.servers) {
                throw new Error('Invalid JSON structure: missing indexData or servers');
            }

            // Clear existing data
            this.servers.clear();
            this.index = new Index({
                preset: 'match',
                tokenize: 'forward',
                resolution: 9,
                optimize: true,
                cache: true
            });

            // Import servers data
            const servers = jsonData.servers;
            for (const [serverId, serverData] of Object.entries(servers)) {
                if (serverData && typeof serverData === 'object') {
                    this.servers.set(serverId, serverData);
                }
            }

            // Rebuild the search index from the imported server data
            // This is more reliable than trying to import the FlexSearch index directly
            console.log('🔄 Rebuilding search index from imported data...');
            for (const [serverId, serverData] of this.servers.entries()) {
                // Create searchable content combining all relevant fields
                const searchContent = [
                    serverData.name,
                    serverData.description,
                ].filter(Boolean).join(' ');

                // Add to FlexSearch index
                this.index.add(serverId, searchContent);
            }

            console.log(`✅ Successfully imported ${this.servers.size} servers from JSON`);
            return {
                success: true,
                serverCount: this.servers.size,
                metadata: jsonData.metadata || {}
            };
        } catch (error) {
            console.error('❌ Error importing from JSON:', error);
            throw error;
        }
    }

    async importFromFile(filePath: string) {
        try {
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(jsonContent);
            return await this.importFromJSON(jsonData);
        } catch (error) {
            console.error(`❌ Error importing from file ${filePath}:`, error);
            throw error;
        }
    }
}

async function buildSearchIndex() {
    try {
        console.log('🚀 Starting MCP Server Search Index Build...');
        console.log('='.repeat(50));

        // Initialize components
        const client = new MCPRegistryClient();
        const searchIndex = new MCPSearchIndex();

        // Fetch all servers
        const data = await client.fetchAllServers();

        if (!Array.isArray(data.servers) || data.servers.length === 0) {
            console.error('❌ No servers found! Check API endpoints.');
            process.exit(1);
        }
        // Add servers to search index
        console.log('\n📊 Building search index...');
        data.servers.forEach((server: any, index: number) => {
            searchIndex.addServer(server);
            if ((index + 1) % 10 === 0 || index === data.servers.length - 1) {
                console.log(`   Indexed ${index + 1}/${data.servers.length} servers`);
            }
        });

        // Export the index
        console.log('\n💾 Exporting search index...');
        const exportData = await searchIndex.exportIndex();

        // Ensure output directory exists
        const outputDir = path.dirname(config.indexPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write the index to file using config path
        fs.writeFileSync(config.indexPath, JSON.stringify(exportData, null, 2));

        // Write a summary file
        const summaryPath = path.join(outputDir, 'index-summary.json');
        const summary = {
            totalServers: searchIndex.getServerCount(),
            buildDate: new Date().toISOString(),
            sampleServers: data.servers.slice(0, 5).map((s: any) => ({
                id: s.id || s.name,
                name: s.name,
                description: s.description
            })),
            tags: Array.from(new Set(data.servers.flatMap((s: any) => s.tags || []))).sort(),
            authors: Array.from(new Set(data.servers.map((s: any) => s.author).filter(Boolean))).sort()
        };
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

        // Test the search functionality
        console.log('\n🔍 Testing search functionality...');
        const testQueries = ['filesystem', 'web', 'database', 'search', 'phone'];
        testQueries.forEach(query => {
            const results = searchIndex.search(query, 3);
            console.log(`   "${query}" -> ${results.length} results`);
        });

        console.log('\n' + '='.repeat(50));
        console.log('✅ Search index build completed successfully!');
        console.log(`📁 Index saved to: ${config.indexPath}`);
        console.log(`📊 Summary saved to: ${summaryPath}`);
        console.log(`🎯 Total servers indexed: ${searchIndex.getServerCount()}`);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

export { MCPRegistryClient, MCPSearchIndex, buildSearchIndex};

