import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodRawShape, ZodTypeAny } from "zod";
import { Logger } from "@origranot/ts-logger";
import { ConsoleErrTransport } from "../../utils.js";

export interface PublicApiMcpServerOptions extends ServerOptions {
    publicApiAuthKey: string;
}

interface PublicApiRequestParam {
    name: string;
    description: string;
    length: number;
    optional: boolean;
}

interface PublicApiEntry {
    name: string;
    description: string;
    url: string;
    params: PublicApiRequestParam[];
    responseType: "JSON" | "XML";
}

interface ToolConfig {
    title?: string;
    description?: string;
    inputSchema?: ZodRawShape | undefined;
    outputSchema?: ZodRawShape | undefined;
    annotations?: ToolAnnotations;
}

const PUBLIC_API_ENTRIES: PublicApiEntry[] = [
    {
        name: "기상청_중기예보 조회서비스",
        description: "지점번호, 발표시각의 조회조건으로 기상전망정보를 조회하는 기능",
        params: [
            {
                name: "ServiceKey",
                description: "공공데이터포털에서 받은 인증키",
                length: 4,
                optional: false,
            },
            {
                name: "pageNo",
                description: "페이지번호",
                length: 4,
                optional: false,
            },
            {
                name: "numOfRows",
                description: "한 페이지 결과 수",
                length: 4,
                optional: false,
            },
            {
                name: "dataType",
                description: "요청자료형식(XML/JSON) Default: XML",
                length: 4,
                optional: true,
            },
            {
                name: "stnId",
                description: "108 전국, 109 서울, 인천, 경기도 등 (활용가이드 하단 참고자료 참조)",
                length: 3,
                optional: false,
            },
            {
                name: "tmFc",
                description:
                    "일 2회(06:00,18:00)회 생성 되며 발표시각 입력 YYYYMMDD0600 (1800)-최근 24시간 자료만 제공, 반드시 현재 이전의 시각이어야 함.",
                length: 12,
                optional: false,
            },
        ],
        url: "http://apis.data.go.kr/1360000/MidFcstInfoService/getMidFcst",
        responseType: "XML",
    },
];

export class PublicApiMcpServer extends McpServer {
    private _authKey: string;
    private _logger: Logger;

    constructor(options: PublicApiMcpServerOptions) {
        super(
            {
                name: "public-api-mcp-server",
                version: "1.0.0",
            },
            options
        );

        this._authKey = options.publicApiAuthKey;

        const transport = new ConsoleErrTransport();

        this._logger = new Logger({
            transports: [transport],
        });

        for (const entry of PUBLIC_API_ENTRIES) {
            super.registerTool(entry.name, this.entryToConfig(entry), this.toolCallback(entry));
        }
    }

    private toolCallback<Args extends ZodRawShape>(entry: PublicApiEntry): ToolCallback<Args> {
        return (async (args, extra) => {
            args.ServiceKey = this._authKey;

            const params = new URLSearchParams(args);
            const url = `${entry.url}?${params.toString()}`;

            this._logger.debug(`requesting to public API endpoint: ${url}`);

            const response = await fetch(url, { method: "GET" });
            const text = await response.text();

            this._logger.debug("public API response:");
            this._logger.debug(response);

            return {
                content: [
                    {
                        type: "text",
                        text: text,
                    },
                ],
            };
        }) as ToolCallback<Args>;
    }

    private entryToConfig(entry: PublicApiEntry): ToolConfig {
        const inputSchema: ZodRawShape = {};

        for (const param of entry.params) {
            if (param.optional) {
                inputSchema[param.name] = z.string().max(param.length).describe(param.description).optional();
            } else {
                inputSchema[param.name] = z.string().max(param.length).describe(param.description);
            }
        }

        return {
            description: entry.description,
            inputSchema: inputSchema,
        };
    }
}
