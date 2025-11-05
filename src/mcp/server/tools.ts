import { z, ZodRawShape } from "zod";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { env } from "node:process";
import { EnvError, McpServerError } from "../../error.js";
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
                            "해당 목록에서 발표관서 코드를 찾을 수 없는 경우, 가장 가까운 위치의 코드 사용.",
                    ),
            },
        },
        callback: async (args, extra) => {
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
    {
        name: "airQualityForecast",
        config: {
            title: "한국환경공단 에어코리아 대기오염정보",
            description: "조회 날짜로 대기질 예보통보를 조회 가능한 서비스",
            inputSchema: {
                date: z.string().describe("대기질 예보통보를 조회할 날짜. YYYY-MM-DD 형식."),
                kind: z
                    .enum(["PM10", "PM25", "O3"])
                    .describe("필요한 대기질 데이터의 종류. PM10: PM10 미세먼지, PM25: PM25 미세먼지, O3: 오존."),
            },
            outputSchema: {
                overall: z.string().describe("전체 예보 개황"),
                cause: z.string().describe("대기질 변동 원인"),
                grades: z.string().describe("각 시도별 대기질 등급"),
                guideline: z.string().describe("대기질에 따른 생활 요령"),
            },
        },
        callback: async ({ date, kind }, extra) => {
            if (env.PUBLIC_API_AUTH_KEY === undefined) {
                throw new EnvError("PUBLIC_API_AUTH_KEY");
            }

            const params = new URLSearchParams({
                serviceKey: env.PUBLIC_API_AUTH_KEY,
                returnType: "json",
                searchDate: date,
                InformCode: kind,
            });

            const url = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth?${params.toString()}`;

            logger.debug("공공데이터포털 API 요청: ", url);

            try {
                const response = await fetch(url, { method: "GET" });
                const json = await response.json();

                logger.debug("공공데이터포털 API 응답: ", response);

                const result = {
                    overall: json.response.body.infornOverall,
                    cause: json.response.body.informCause,
                    grades: json.response.body.informGrade,
                    guideline: json.response.body.actionKnack,
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result),
                        },
                    ],
                    structuredContent: result,
                };
            } catch {
                throw new McpServerError();
            }
        },
    },
];
