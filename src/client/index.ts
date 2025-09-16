import { PublicApiMcpClient } from "./client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "node:readline";

const client = new PublicApiMcpClient();
const transport = new StdioClientTransport({
    command: "node",
    args: ["./build/index.js"],
});

client.connect(transport);

const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

input.question(">> ", async (content) => {
    const response = await client.chat(content);
    console.log(response);
});
