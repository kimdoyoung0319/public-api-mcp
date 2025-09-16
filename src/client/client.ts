import { ContentBlockSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client";
import { Ollama, Message, ToolCall, ChatResponse, Tool as OllamaTool } from "ollama";

export class PublicApiMcpClient extends Client {
    private static readonly OLLAMA_DEFAULT_HOST = "http://127.0.0.1:11434";

    private _ollama: Ollama;
    private _tools: OllamaTool[] | undefined;
    // TODO: Modify this to support different kind of models.
    private _model: string = "gpt-oss:20b";

    constructor() {
        super({
            name: "public-api-mcp-client",
            version: "0.0.1",
        });

        this._ollama = new Ollama({ host: PublicApiMcpClient.OLLAMA_DEFAULT_HOST });
    }

    private adaptTool(tool: Tool): OllamaTool {
        return {
            type: "function" as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: tool.inputSchema.properties as any,
                    required: tool.inputSchema.required,
                },
            },
        };
    }

    private async fetchTools() {
        const listToolsResult = await this.listTools();
        this._tools = listToolsResult.tools.map(this.adaptTool);
    }

    private async callTools(calls: ToolCall[]): Promise<Message[]> {
        let messages: Message[] = [];

        for (const call of calls) {
            const result = await this.callTool({
                name: call.function.name,
                arguments: call.function.arguments,
            });

            const parsed = ContentBlockSchema.safeParse(result.content);

            if (parsed.success) {
                messages.push({
                    role: "tool",
                    content: JSON.stringify(parsed.data.text),
                });
            }
        }

        return messages;
    }

    async chat(content: string): Promise<string> {
        if (this._tools === undefined) this.fetchTools();

        let response: ChatResponse;
        let messages: Message[] = [
            {
                role: "user",
                content: content,
            },
        ];

        do {
            response = await this._ollama.chat({
                model: this._model,
                messages: messages,
                tools: this._tools,
            });

            if (response.message.tool_calls !== undefined) {
                const toolResults = await this.callTools(response.message.tool_calls);
                messages.concat(toolResults);
            }
        } while (response.message.tool_calls !== undefined);

        return response.message.content;
    }
}
