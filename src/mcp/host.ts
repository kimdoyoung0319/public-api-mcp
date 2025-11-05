import { Ollama, Tool } from "ollama";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "../utils.js";
import { EnvError } from "./error.js";
import { Message, ToolCall, ChatResponse } from "../types.js";
import 'dotenv/config';

const SYSTEM_PROMPT: Message = {
    role: "system",
    content: "You are an AI agent that helps people to use Korean government's public API. Prefer answer in Korean.",
};

interface PublicApiMcpHostOptions {
    /**
     * MCP 호스트가 사용할 모델의 `ollama list` 결과의 `name` 필드에 나타나는 이름.
     */
    model: string;
}

export class PublicApiMcpHost {
    private _ollama = new Ollama();
    private _options: PublicApiMcpHostOptions;
    private _tools: Tool[] | undefined;

    private _client = new Client({
        name: "public-api-mcp-client",
        version: "1.0.0",
    });

    constructor(options: PublicApiMcpHostOptions) {
        if (process.env.PUBLIC_API_AUTH_KEY === undefined) {
            throw new EnvError("PUBLIC_API_AUTH_KEY");
        }

        const transport = new StdioClientTransport({
            command: "node",
            args: ["dist/mcp/server/index.js"],
            env: {
                PUBLIC_API_AUTH_KEY: process.env.PUBLIC_API_AUTH_KEY,
            },
        });

        this._client.connect(transport);
        this._options = options;

        this.fetchTools();
    }

    /**
     * MCP 서버에서 툴 목록을 받아오는 함수.
     *
     * @modifies {this._tools} 현재 MCP 호스트 객체의 툴 목록.
     */
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

        logger.debug("호스트 사용 가능 툴 목록: ", this._tools);
    }

    /**
     * 툴 호출의 목록을 받아 호출 결과를 반환하는 함수.
     *
     * @param calls 툴 호출 목록.
     * @returns 툴 호출 순서와 일치하는 결과 메세지 목록.
     */
    private async callTools(calls: ToolCall[]): Promise<Message[]> {
        const messages = [];

        for (const call of calls) {
            logger.debug("툴 호출: ", call);

            const response = await this._client.callTool({
                name: call.function.name,
                arguments: call.function.arguments,
            });

            logger.debug("MCP 서버 응답:", response);

            messages.push({
                role: "tool",
                content: JSON.stringify(response.content),
            });
        }

        return messages;
    }

    /**
     * 컨텍스트 및 유저 프롬프트를 받아 시스템 프롬프트와 함께 응답을 생성하는 함수.
     *
     * @param messages 유저 프롬프트와 컨텍스트를 포함하는 메세지의 목록.
     * @returns 생성된 응답의 스트림.
     */
    async *chat(messages: Message[]): AsyncGenerator<ChatResponse> {
        messages = [SYSTEM_PROMPT, ...messages];

        if (this._tools === undefined) {
            this.fetchTools();
        }

        const calls: ToolCall[] = [];

        do {
            const response = await this._ollama.chat({
                model: this._options.model,
                messages: messages,
                tools: this._tools,
                stream: true,
            });

            calls.length = 0;

            for await (const chunk of response) {
                if (chunk.message.tool_calls?.length) {
                    calls.push(...chunk.message.tool_calls);
                }

                yield chunk;
            }

            if (calls.length) {
                const result = await this.callTools(calls);
                messages.push(...result);
            }
        } while (calls.length);
    }

    /**
     * 현재 MCP 호스트가 작동하는지 확인하는 함수.
     *
     * @returns 현재 MCP 호스트의 정상 작동 여부.
     */
    async check(): Promise<boolean> {
        try {
            const ping = await this._client.ping();

            if (this._ollama.ps() === undefined || this._tools === undefined || ping === undefined) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * 현재 MCP 호스트가 사용중인 모델을 반환하는 함수.
     *
     * @returns 현재 MCP 호스트가 사용중인 모델.
     */
    model(): string {
        return this._options.model;
    }
}
