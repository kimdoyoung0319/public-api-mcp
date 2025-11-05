import { z, ZodRawShape } from "zod";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { env } from "node:process";
import { EnvError, McpServerError } from "../error.js";
import { logger } from "../../utils.js";

interface ToolConfig {
    title?: string;
    description?: string;
    inputSchema?: ZodRawShape | undefined;
    outputSchema?: ZodRawShape | undefined;
    annotations?: ToolAnnotations;
}

export interface McpTool {
    name: string;
    config: ToolConfig;
    callback: ToolCallback<ZodRawShape>;
}

export const PUBLIC_API_TOOLS: McpTool[] = [
    {
        name: "weatherForecast",
        config: {
            title: "한국 기상청 동네예보 통보문 조회",
            description:
                "발표관서의 조회조건으로 마지막 예보시각으로부터 4일 후까지의 날씨 예보를 조회할 수 있는 서비스",
            inputSchema: {
                region: z
                    .number()
                    .describe(
                        "일기예보를 조회할 발표관서. " +
                            "기상청: 108, 수도권(서울): 109, 부산: 159, 대구: 143, 광주: 156, 전주: 146," +
                            "대전: 133, 청주: 131, 강원: 105, 제주: 184. " +
                            "해당 목록에서 발표관서 코드를 찾을 수 없는 경우, 가장 가까운 위치의 코드 사용."
                    ),
            },
        },
        callback: async function (args, extra) {
            if (env.PUBLIC_API_AUTH_KEY === undefined) {
                throw new EnvError("PUBLIC_API_AUTH_KEY");
            }

            const region = typeof args.region === "string" ? args.region : args.region.toString();

            const params = new URLSearchParams({
                ServiceKey: env.PUBLIC_API_AUTH_KEY,
                pageNo: "1",
                numOfRows: "10",
                dataType: "JSON",
                stnId: region,
            });

            const url =
                "http://apis.data.go.kr/1360000/VilageFcstMsgService/getWthrSituation" + `?${params.toString()}`;

            logger.debug("공공데이터포털 API 요청: ", url);

            try {
                const response = await fetch(url, { method: "GET" });

                logger.debug("공공데이터포털 API 응답: ", response);

                const json = await response.json();

                const forecast = json.response.body.items.item[0].wfSv1;

                return {
                    content: [
                        {
                            type: "text",
                            text: forecast,
                        },
                    ],
                };
            } catch {
                throw new McpServerError();
            }
        },
    },
];
