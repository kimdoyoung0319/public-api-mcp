import { PublicApiMcpServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { env } from "node:process";

if (env.PUBLIC_API_AUTH_KEY === undefined) {
    throw new Error("public API authentication key must be provided");
}

const server = new PublicApiMcpServer({
    publicApiAuthKey: env.PUBLIC_API_AUTH_KEY,
});

const transport = new StdioServerTransport();

await server.connect(transport);
