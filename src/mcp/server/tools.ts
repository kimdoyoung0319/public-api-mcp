import { z, ZodRawShape } from "zod";
import { ToolAnnotations, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EnvError, McpServerError } from "../../error.js";
import { logger } from "../../utils.js";
import "dotenv/config";

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

/**
 * 텍스트 형식의 API 응답을 `CallToolResult`로 변환하는 함수.
 *
 * @param text 변환할 텍스트 형식의 API 응답.
 * @returns 변환된 API 응답.
 */
function convertTextContent(text: string): CallToolResult {
    return {
        content: [
            {
                type: "text",
                text: text,
            },
        ],
    };
}

/**
 * 구조화된 형식의 API 응답을 `CallToolResult`로 변환하는 함수.
 *
 * @param content 변환할 구조화된 형식의 API 응답.
 * @returns 변환된 API 응답.
 */
function convertStructuredContent(content: any): CallToolResult {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(content),
            },
        ],
        structuredContent: content,
    };
}

// TODO: API 요청 실패시 예외 던지는게 아니라 에러 객체 반환하도록 수정
// TODO: 타임아웃 구현
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
        callback: async (args, extra) => {
            if (!process.env.PUBLIC_API_AUTH_KEY) {
                throw new EnvError("PUBLIC_API_AUTH_KEY");
            }

            const region = typeof args.region === "string" ? args.region : args.region.toString();

            const params = new URLSearchParams({
                ServiceKey: process.env.PUBLIC_API_AUTH_KEY,
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

                return convertTextContent(forecast);
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
            if (!process.env.PUBLIC_API_AUTH_KEY) {
                throw new EnvError("PUBLIC_API_AUTH_KEY");
            }

            const params = new URLSearchParams({
                serviceKey: process.env.PUBLIC_API_AUTH_KEY,
                returnType: "json",
                searchDate: date,
                InformCode: kind,
            });

            const url =
                "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth?" + params.toString();

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

                return convertStructuredContent(result);
            } catch {
                throw new McpServerError();
            }
        },
    },
    {
        name: "exchangeRate",
        config: {
            title: "한국수출입은행 현재환율 API",
            description: "원화를 기준으로 한 타국 통화의 환율을 확인할 수 있는 API",
            inputSchema: {
                date: z
                    .string()
                    .describe(
                        "환율 정보를 검색할 날짜로, 제공하지 않을 시 현재 날짜를 기준으로 검색됨. YYYYMMDD 형식으로, 비영업일의 데이터, 혹은 영업당일 11시 이전에 해당일의 데이터를 요청할 경우 null 값이 반환."
                    ),
            },
            outputSchema: {
                entries: z.array(
                    z.object({
                        currencyCode: z.string().describe("통화코드"),
                        currencyName: z.string().describe("통화명"),
                        telegraphicTransferBuy: z.string().describe("전신환(송금) 받으실때"),
                        telegraphicTransferSell: z.string().describe("전신환(송금) 보내실때"),
                        baseRate: z.string().describe("매매 기준율"),
                    })
                ),
            },
        },
        callback: async ({ date }, extra) => {
            const schema = z.array(
                z.object({
                    result: z.number(),
                    cur_unit: z.string(),
                    cur_nm: z.string(),
                    ttb: z.string(),
                    tts: z.string(),
                    deal_bas_r: z.string(),
                    bkpr: z.string(),
                    yy_efee_r: z.string(),
                    ten_dd_efee_r: z.string(),
                    kftc_deal_bas_r: z.string(),
                    kftc_bkpr: z.string(),
                })
            );

            const params = new URLSearchParams({
                authkey: process.env.KOREA_EXIMBANK_AUTH_KEY!,
                searchdate: "20251105",
                data: "AP01",
            });

            const url = "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?" + params.toString();

            console.log(url);

            const body = await fetch(url, { method: "GET" }).then(async (res) => {
                const json = await res.json();
                return schema.safeParse(json);
            });

            if (body.success) {
                const entries = [];

                for (const entry of body.data) {
                    entries.push({
                        currencyCode: entry.cur_unit,
                        currencyName: entry.cur_nm,
                        telegraphicTransferBuy: entry.ttb,
                        telegraphicTransferSell: entry.tts,
                        baseRate: entry.deal_bas_r,
                    });
                }

                return convertStructuredContent({ entries });
            } else {
                throw new McpServerError();
            }
        },
    },
];
