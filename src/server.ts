import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PublicApiAdapter } from "./adapter.js";
import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";

interface PublicApiMcpServerOptions extends ServerOptions {}

/***
 * A MCP Server that additionally provides tools to access public API.
 */
class PublicApiMcpServer extends McpServer {
    private static _publicApiAdapter = new PublicApiAdapter();

    constructor(options?: PublicApiMcpServerOptions) {
        super(
            {
                name: "public-api-mcp-server",
                version: "1.0.0",
            },
            options
        );
    }

    private fetchToolTable(): void {}
}
