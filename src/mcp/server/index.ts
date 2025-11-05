import { PublicApiMcpServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EnvError } from "../../error.js";
import "dotenv/config";

const ENV_REQUIRED = ["PUBLIC_API_AUTH_KEY", "KOREA_EXIMBANK_AUTH_KEY"];

for (const env of ENV_REQUIRED) {
    if (!process.env[env]) {
        throw new EnvError(env);
    }
}

const server = new PublicApiMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
