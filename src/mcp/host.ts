import { Ollama, ToolCall, Message, Tool as OllamaTool, AbortableAsyncIterator, ChatResponse } from "ollama";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { env } from "node:process";
import { Logger } from "@origranot/ts-logger";

const SYSTEM_PROMPT: Message = {
    role: "system",
    content: "You are an AI agent that helps people to use Korean government's public API. Prefer answer in Korean.",
};

interface PublicApiMcpHostOptions {
    /**
     * Which model does the host use?
     *
     * Note: This is the exact string that can be found by `ollama list`.
     */
    model: string;
}

export class PublicApiMcpHost {
    private _ollama = new Ollama();
    private _options: PublicApiMcpHostOptions;
    private _tools: OllamaTool[] | undefined;
    private _logger: Logger;
    private _client = new Client({
        name: "public-api-mcp-client",
        version: "1.0.0",
    });

    constructor(options: PublicApiMcpHostOptions) {
        if (env.PUBLIC_API_AUTH_KEY === undefined || env.WEATHER_FORECAST_AUTH_KEY === undefined) {
            throw new Error("authentication keys must be provided");
        }

        const transport = new StdioClientTransport({
            command: "node",
            args: ["dist/mcp/server/index.js"],
            env: {
                PUBLIC_API_AUTH_KEY: env.PUBLIC_API_AUTH_KEY,
                WEATHER_FORECAST_AUTH_KEY: env.WEATHER_FORECAST_AUTH_KEY,
            },
        });

        this._client.connect(transport);
        this._options = options;
        this._logger = new Logger();

        this.fetchTools();
    }

    private async fetchTools() {
        const response = await this._client.listTools();

        this._tools = response.tools.map((tool) => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: tool.inputSchema.properties as any,
                    required: tool.inputSchema.required,
                },
            },
        }));

        this._logger.debug("fetched list of tools:", this._tools);
    }

    private async callTools(calls: ToolCall[]): Promise<Message[]> {
        const messages = [];

        for (const call of calls) {
            this._logger.debug("making tool call:", call);

            const response = await this._client.callTool({
                name: call.function.name,
                arguments: call.function.arguments,
            });

            this._logger.debug("MCP server response:", response);

            messages.push({
                role: "tool",
                content: JSON.stringify(response.content),
            });
        }

        return messages;
    }

    private async *requestChat(messages: Message[]): AsyncGenerator<string> {
        if (this._tools === undefined) {
            this.fetchTools();
        }

        this._logger.debug("requesting chat completion with following messages:", messages);

        while (true) {
            const response = await this._ollama.chat({
                model: this._options.model,
                messages: messages,
                tools: this._tools,
                stream: true,
            });

            let thinking = "";
            let content = "";
            let isThinking = false;

            const calls: ToolCall[] = [];

            for await (const chunk of response) {
                if (chunk.message.thinking) {
                    thinking += chunk.message.thinking;

                    if (!isThinking) {
                        isThinking = true;
                        yield "Thinking: ";
                    }

                    yield chunk.message.thinking;
                }

                if (chunk.message.content) {
                    content += chunk.message.content;

                    if (isThinking) {
                        isThinking = false;
                        yield "\n";
                    }

                    yield chunk.message.content;
                }

                if (chunk.message.tool_calls?.length) {
                    this._logger.debug("tool call: ", chunk.message.tool_calls);
                    calls.push(...chunk.message.tool_calls);
                }
            }

            if (thinking || content || calls.length > 0) {
                messages.push({ role: "assistant", thinking, content, tool_calls: calls });
            }

            if (calls.length == 0) {
                break;
            }

            const result = await this.callTools(calls);
            messages = messages.concat(result);
        }
    }

    async *chat(content: string): AsyncGenerator<string> {
        const messages = [
            SYSTEM_PROMPT,
            {
                role: "user",
                content: content,
            },
        ];

        // TODO: Add context saving capability.

        yield* this.requestChat(messages);
    }
}
