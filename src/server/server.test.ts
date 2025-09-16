import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { PublicApiMcpServerOptions, PublicApiMcpServer } from "./server.ts";
import { Client } from "@modelcontextprotocol/sdk/client";

let server: PublicApiMcpServer = new PublicApiMcpServer({
    useDbForTools: false,
    toolDbConnectionConfig: {},
    toolFilePath: "../data/tools.test.json",
    publicApiAuthKey: "",
});
