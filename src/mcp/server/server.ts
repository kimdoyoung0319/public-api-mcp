import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodRawShape, ZodTypeAny } from "zod";
import { Logger } from "@origranot/ts-logger";
import { ConsoleErrTransport } from "../../utils.js";
import { PUBLIC_API_TOOLS } from "./tools.js";

export interface PublicApiMcpServerOptions extends ServerOptions {
    publicApiAuthKey: string;
}

interface ToolConfig {
    title?: string;
    description?: string;
    inputSchema?: ZodRawShape | undefined;
    outputSchema?: ZodRawShape | undefined;
    annotations?: ToolAnnotations;
}

export class PublicApiMcpServer extends McpServer {
    private _authKey: string;
    private _logger: Logger;

    constructor(options: PublicApiMcpServerOptions) {
        super(
            {
                name: "public-api-mcp-server",
                version: "1.0.0",
            },
            options
        );

        this._authKey = options.publicApiAuthKey;

        const transport = new ConsoleErrTransport();

        this._logger = new Logger({
            transports: [transport],
        });

        for (const tool of PUBLIC_API_TOOLS) {
            super.registerTool(tool.name, tool.config, tool.callback);
        }
    }
}
