import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PublicApiAdapter, PublicApiResponseType, PublicApiResponseTypeSchema } from "./adapter.js";
import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { ConnectionConfig } from "mysql";
import { z, ZodRawShape, ZodTypeAny } from "zod";
import { request } from "http";

/**
 * Additional options for public API MCP server.
 */
interface PublicApiMcpServerOptions extends ServerOptions {
    /**
     * Should the server use DB to discover tools?
     */
    useDbForTools: boolean;
    /**
     * Configuration for DB connection. Ignored when `useDbForTools` is set to `false`.
     */
    toolDbConnectionConfig: ConnectionConfig;
    /**
     * Relative path of the tool JSON file. Ignored when `useDbForTools` is set to `true`.
     *
     * FIXME: This might be problematic for non-Unix systems.
     */
    toolFilePath: string;
    /**
     * Authentication key for public API.
     */
    publicApiAuthKey: string;
}

/**
 * Schema of a request parameter of public API.
 */
const PublicApiRequestParamSchema = z.object({
    /**
     * Name of the request parameter.
     */
    name: z.string(),
    /**
     * Description of the request parameter.
     */
    description: z.string(),
    /**
     * Length of the request parameter.
     */
    length: z.number(),
    /**
     * Is this parameter optional?
     */
    optional: z.boolean(),
});

type PublicApiRequestParam = z.infer<typeof PublicApiRequestParamSchema>;

/**
 * Schema of an entry of public API.
 */
const PublicApiEntrySchema = z.object({
    /**
     * Name of the entry.
     */
    name: z.string(),
    /**
     * Description of the entry.
     */
    description: z.string(),
    /**
     * Request parameters of the entry.
     */
    params: z.array(PublicApiRequestParamSchema),
    /**
     * Request URL of the entry.
     */
    url: z.string(),
    /**
     * Type of the resulting output.
     */
    resonseType: PublicApiResponseTypeSchema,
});

type PublicApiEntry = z.infer<typeof PublicApiEntrySchema>;

/**
 * A MCP Server that additionally provides tools to access public API.
 */
class PublicApiMcpServer extends McpServer {
    private static _publicApiAdapter = new PublicApiAdapter();
    // FIXME: Mapping an API entry to a tool might not be a good idea. We need to come up with a better idea to handle
    //        vast number of APIs so that the LLM is able to handle them. Currently, the server maps an API to exactly
    //        one tool, since this project is currently on proof-of-concept state.
    private _useDbForTools = false;
    private _toolDbConnectionConfig = {};
    private _toolFilePath = "../data/tools.json";
    private _publicApiAuthKey = "";

    private static requestParamsToSchema(requestParams: PublicApiRequestParam[]): ZodRawShape {
        let params = requestParams.map((param) => [param.name, z.string().length(param.length)]);
        return Object.fromEntries(params);
    }

    private toolCallbackTemplate<Args extends ZodRawShape>(
        url: string,
        schema: Args,
        responseType: PublicApiResponseType
    ): ToolCallback<Args> {
        return async function (args, extra): Promise<CallToolResult> {
            let requestUrl = url + "?";

            for (const key of Object.keys(schema)) {
                if (key === "serviceKey") {
                    requestUrl += "serviceKey=" + this._publicApiAuthKey;
                } else {
                    requestUrl += "&" + key + "=" + args[key];
                }
            }

            let data = await fetch(requestUrl, { method: "GET" }).then((response) => response.text());

            return PublicApiMcpServer._publicApiAdapter.convert(data, responseType);
        } as ToolCallback<Args>;
    }

    constructor(options?: PublicApiMcpServerOptions) {
        let entries: PublicApiEntry[];

        super(
            {
                name: "public-api-mcp-server",
                version: "0.0.1",
            },
            options
        );

        if (options !== undefined) {
            this._useDbForTools = options.useDbForTools;
            this._toolDbConnectionConfig = options.toolDbConnectionConfig;
            this._toolFilePath = options.toolFilePath;
            this._publicApiAuthKey = options.publicApiAuthKey;
        }

        if (this._useDbForTools) {
            throw new Error("Not implemented");
        } else {
            entries = z.array(PublicApiEntrySchema).parse(require(this._toolFilePath));
        }

        for (const entry of entries) {
            let schema = PublicApiMcpServer.requestParamsToSchema(entry.params);

            super.tool(
                entry.name,
                entry.description,
                schema,
                this.toolCallbackTemplate(entry.url, schema, entry.resonseType)
            );
        }
    }
}
