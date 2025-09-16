import { PublicApiMcpServer } from "./server";
// TODO: Change this to `StreamableHTTPServerTransport`.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new PublicApiMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
