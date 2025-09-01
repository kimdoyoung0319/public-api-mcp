import { PublicApiAdapter, PublicApiResponseType } from "./adapter";
import { z } from "zod";

const CORRECT_JSON_RESPONSE: string = `{
    "response": {
        "header": {
            "resultCode": "00",
            "resultMsg": "NORMAL_SERVICE"
        },
        "body": {
            "dataType": "JSON",
            "items": {
                "item": [{
                    "wfSv": "○ (강수) 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다.\\n○ (기온) 아침 기온은 20~26℃, 낮 기온은 27~33℃로 평년(최저기온 17~21℃, 최고기온 25~29℃)보다 높겠습니다.\\n○ (주말전망) 전국이 구름많거나 흐리겠고, 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다. 아침 기온은 21~26℃, 낮 기온은 29~32℃가 되겠습니다.\\n\\n* (기온) 이번 예보기간 최고체감온도가 33℃ 안팎으로 올라 무더운 날이 있겠고, 열대야가 나타나는 곳이 있겠으니, 건강관리에 유의하기 바랍니다.\\n* (변동성) 이번 예보기간 북태평양고기압 가장자리 위치와 열대요란 등 우리나라 주변 기압계 변화에 따라 강수지역과 시점이 변경될 가능성이 있겠으니,\\n           앞으로 발표되는 최신 예보를 참고하기 바랍니다."
                }]
            },
            "pageNo": 1,
            "numOfRows": 10,
            "totalCount": 1
        }
    }
}`;

const INCORRECT_JSON_RESPONSE: string = `{
    "response": {
        : {
            "resultCode": "00",
            "resultMsg": "NORMAL_SERVICE"
        },
        "body": {
            "dataType": "JSON",
            "items": {},
            "pageNo": 1,
            "numOfRows": 10,
            "totalCount": 1
        }
    }
}`;

const CORRECT_XML_RESPONSE: string = `
<?xml version="1.0" encoding="UTF-8"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL_SERVICE</resultMsg>
    </header>
    <body>
        <dataType>XML</dataType>
        <items>
            <item>
                <wfSv>○ (강수) 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다.
○ (기온) 아침 기온은 20~26℃, 낮 기온은 27~33℃로 평년(최저기온 17~21℃, 최고기온 25~29℃)보다 높겠습니다.
○ (주말전망) 전국이 구름많거나 흐리겠고, 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다. 아침 기온은 21~26℃, 낮 기온은 29~32℃가 되겠습니다.

* (기온) 이번 예보기간 최고체감온도가 33℃ 안팎으로 올라 무더운 날이 있겠고, 열대야가 나타나는 곳이 있겠으니, 건강관리에 유의하기 바랍니다.
* (변동성) 이번 예보기간 북태평양고기압 가장자리 위치와 열대요란 등 우리나라 주변 기압계 변화에 따라 강수지역과 시점이 변경될 가능성이 있겠으니,
           앞으로 발표되는 최신 예보를 참고하기 바랍니다.
                </wfSv>
            </item>
        </items>
        <numOfRows>10</numOfRows>
        <pageNo>1</pageNo>
        <totalCount>1</totalCount>
    </body>
</response>
`;

const INCORRECT_XML_RESPONSE: string = `
<?xml version="1.0" encoding="UTF-8"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL_SERVICE</resultMsg>
    </header>
    <body>
        <dataType>XML</dataType>
        <items>
        </items>
        <numOfRows>10</numOfRows>
        <pageNo>1</pageNo>
        <totalCount>1</totalCount>
    </body>
</response>
`;

const EXPECTED_JSON = {
    content: [],
    structuredContent: {
        response: {
            header: {
                resultCode: "00",
                resultMsg: "NORMAL_SERVICE",
            },
            body: {
                dataType: "JSON",
                items: {
                    item: [
                        {
                            wfSv: `○ (강수) 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다.
○ (기온) 아침 기온은 20~26℃, 낮 기온은 27~33℃로 평년(최저기온 17~21℃, 최고기온 25~29℃)보다 높겠습니다.
○ (주말전망) 전국이 구름많거나 흐리겠고, 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다. 아침 기온은 21~26℃, 낮 기온은 29~32℃가 되겠습니다.

* (기온) 이번 예보기간 최고체감온도가 33℃ 안팎으로 올라 무더운 날이 있겠고, 열대야가 나타나는 곳이 있겠으니, 건강관리에 유의하기 바랍니다.
* (변동성) 이번 예보기간 북태평양고기압 가장자리 위치와 열대요란 등 우리나라 주변 기압계 변화에 따라 강수지역과 시점이 변경될 가능성이 있겠으니,
           앞으로 발표되는 최신 예보를 참고하기 바랍니다.`,
                        },
                    ],
                },
                pageNo: 1,
                numOfRows: 10,
                totalCount: 1,
            },
        },
    },
};

const EXPECTED_XML = {
    content: [],
    structuredContent: {
        "?xml": "",
        response: {
            body: {
                dataType: "XML",
                items: {
                    item: {
                        wfSv: `○ (강수) 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다.
○ (기온) 아침 기온은 20~26℃, 낮 기온은 27~33℃로 평년(최저기온 17~21℃, 최고기온 25~29℃)보다 높겠습니다.
○ (주말전망) 전국이 구름많거나 흐리겠고, 6일(토) 중부지방(강원영동 제외)과 전라권에 비가 내리겠습니다. 아침 기온은 21~26℃, 낮 기온은 29~32℃가 되겠습니다.

* (기온) 이번 예보기간 최고체감온도가 33℃ 안팎으로 올라 무더운 날이 있겠고, 열대야가 나타나는 곳이 있겠으니, 건강관리에 유의하기 바랍니다.
* (변동성) 이번 예보기간 북태평양고기압 가장자리 위치와 열대요란 등 우리나라 주변 기압계 변화에 따라 강수지역과 시점이 변경될 가능성이 있겠으니,
           앞으로 발표되는 최신 예보를 참고하기 바랍니다.`,
                    },
                },
                numOfRows: 10,
                pageNo: 1,
                totalCount: 1,
            },
            header: {
                resultCode: 0,
                resultMsg: "NORMAL_SERVICE",
            },
        },
    },
};

const ITEM_SCHEMA = z.object({ wfSv: z.string() });

const OUTPUT_SCHEMA = z.object({
    response: z.object({
        body: z.object({
            items: z.object({
                item: z.union([z.array(ITEM_SCHEMA), ITEM_SCHEMA]),
            }),
        }),
    }),
});

test("Converting correct JSON data without output schema must succeed", () => {
    const adapter = new PublicApiAdapter();
    const result = adapter.convert(CORRECT_JSON_RESPONSE, PublicApiResponseType.JSON);

    expect(result).toEqual(EXPECTED_JSON);
});

test("Converting correct XML data without output schema must succeed", () => {
    const adapter = new PublicApiAdapter();
    const result = adapter.convert(CORRECT_XML_RESPONSE, PublicApiResponseType.XML);

    expect(result).toEqual(EXPECTED_XML);
});

test("Converting correct JSON data with output schema must succeed", () => {
    const adapter = new PublicApiAdapter();
    const result = adapter.convert(CORRECT_JSON_RESPONSE, PublicApiResponseType.JSON, OUTPUT_SCHEMA);

    expect(result).toEqual({
        content: [],
        structuredContent: OUTPUT_SCHEMA.parse(EXPECTED_JSON.structuredContent),
    });
});

test("Converting correct XML data with output schema must succeed", () => {
    const adapter = new PublicApiAdapter();
    const result = adapter.convert(CORRECT_XML_RESPONSE, PublicApiResponseType.XML, OUTPUT_SCHEMA);

    expect(result).toEqual({
        content: [],
        structuredContent: OUTPUT_SCHEMA.parse(EXPECTED_XML.structuredContent),
    });
});

test("Converting incorrect JSON data without output schema must throw an exception", () => {
    const adapter = new PublicApiAdapter();

    expect(() => {
        adapter.convert(INCORRECT_JSON_RESPONSE, PublicApiResponseType.JSON);
    }).toThrow();
});

test("Converting incorrect XML data with output schema must throw an exception", () => {
    const adapter = new PublicApiAdapter();

    expect(() => {
        adapter.convert(INCORRECT_JSON_RESPONSE, PublicApiResponseType.JSON, OUTPUT_SCHEMA);
    }).toThrow();
});
