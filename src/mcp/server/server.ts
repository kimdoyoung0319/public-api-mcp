import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PUBLIC_API_TOOLS } from "./tools.js";

/** 공공API를 이용한 MCP 서버 클래스. */
export class PublicApiMcpServer extends McpServer {
    /**
     * 공공API를 이용한 MCP 서버의 생성자.
     *
     * @param options 서버 생성시 전달될 옵션. `PublicApiMcpServerOptions` 참조.
     */
    constructor(options?: ServerOptions) {
        super(
            {
                name: "public-api-mcp-server",
                version: "1.0.0",
            },
            options
        );

        for (const tool of PUBLIC_API_TOOLS) {
            super.registerTool(tool.name, tool.config, tool.callback);
        }
    }
}
