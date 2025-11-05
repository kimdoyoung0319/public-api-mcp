import { PublicApiMcpServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { env } from "node:process";
import { EnvError } from "../error.js";

if (env.PUBLIC_API_AUTH_KEY === undefined) {
    throw new EnvError("PUBLIC_API_AUTH_KEY");
}

const server = new PublicApiMcpServer({
    publicApiAuthKey: env.PUBLIC_API_AUTH_KEY,
});

const transport = new StdioServerTransport();

await server.connect(transport);


