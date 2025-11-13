# 삼성 SDS 클라우드기반 공공IT서비스

## MCP 호스트 및 서버

### 의존성

해당 서버를 구동하기 위해서는 다음이 필요합니다.

-   [Ollama](https://ollama.com) 및 `gpt-oss:20b-cloud` 모델

    -   `src/index.ts`에서 `PublicApiMcpHost` 클래스 생성자의 `models` 인자를 수정하여 다른 모델을 사용할 수도 있습니다.
    -   현재 설치된 모델 목록은 `ollama list`로 확인할 수 있습니다.
    -   `models` 인자는 `ollama list` 실행시 `NAME` 필드로 나타나는 모델 이름이어야 합니다.
    -   `ollama pull {model_name}`으로 필요한 모델을 설치할 수 있습니다.
    -   모델은 반드시 MCP Tool을 지원해야 합니다. [이 링크](https://ollama.com/search?c=tools)에서 Tool 지원 모델의 목록
        을 확인할 수 있습니다.
    -   클라우드 모델 사용 관련
        -   `gpt-oss:20b-cloud` 모델을 사용하기 위해서는 [Ollama 계정 생성](https://signin.ollama.com) 및 CLI 클라이언트
            에서 Signin이 필요합니다.
        -   [Ollama 클라우드 모델 공식 문서](https://docs.ollama.com/cloud)를 참조하여 Signin 과정을 진행해 주세요.

-   `npm 11.4.2` 혹은 더 최신의 버전
-   `node v24.3.0` 혹은 더 최신의 버전

### 서버 구동

서버를 실행하기 이전에 Ollama가 실행중인지 확인해야 합니다.

```
ps aux | grep ollama | grep -v grep
```

만약 해당 커맨드 실행 결과로 Ollama 프로세스가 확인되지 않는다면, `ollama serve`로 Ollama 프로세스를 실행해 주세요.

이후에는 `.env` 예시 파일을 복사한 후 `change-me`를 실제 API 인증키로 변경해 주세요. 이외에도 서버 포트(`PORT`) 설정과로
그 레벨(`LOG_LEVEL`) 설정을 .env 파일로 할 수 있습니다. 가능한 로그 레벨은 `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` 중
하나입니다. 설정한 로그 레벨 이하의 로그는 무시됩니다.

```
cp .env.example .env
sed -i '' '/PUBLIC_API_AUTH_KEY/c\{your-public-api-auth-key}' .env
sed -i '' '/KOREA_EXIMBANK_AUTH_KEY/c\{your-korea-eximbank-auth-key}' .env
```

Ollama 실행 및 `.env` 파일의 준비가 끝났다면, 다음을 이용해 MCP 호스트를 실행할 수 있습니다.

```
npm run start
```

`your-public-api-auth-key`에는 [공공데이터포털](http://www.data.go.kr)에서 발급받은 인증 키를 입력해야 하며,
`your-korea-eximbank-auth-key`에는 [한국수출입은행](https://www.koreaexim.go.kr/ir/HPHKIR019M01)에서 발급받은 인증 키를
입력해야 합니다. 모든 인증키를 발급받은 계정은 반드시 필요한 API에 대한 사용신청과 승인이 되어있어햐 합니다.

#### 현재 사용중인 API 목록

만약 새 계정을 활용하여 테스트를 진행할 경우, 다음 API에 대한 활용신청을 먼저 진행해 주세요.

-   공공데이터포털 오픈API
    -   [기상청 동네예보 통보문 조회서비스](https://www.data.go.kr/data/15058629/openapi.do)
    -   [한국환경공단 에어코리아 대기오염정보](https://www.data.go.kr/data/15073861/openapi.do)
-   한국수출입은행 오픈API
    -   [한국수출입은행 현재환율 API](https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2&viewtype=C&searchselect=&searchword=)

### 디렉터리 구조

-   `src/mcp`

    -   공공API의 MCP 래퍼와 관련된 MCP 서버 및 호스트 관련 파일들이 위치합니다.

    *   `src/mcp/server`

        -   공공API MCP 래퍼 서버 구현에 관련된 파일들이 위치합니다.

        *   `src/mcp/index.ts`

            -   공공API MCP 래퍼 서버의 실행을 위한 인덱스 파일입니다.
            -   일반적으로는 `npm run start` 실행시, MCP 호스트가 구동 과정에서 자동으로 대응되는 MCP 서버를 실행하므로
                따로 해당 스크립트를 Node.js로 실행할 필요는 없습니다.
            -   또한, `npm run start` 실행 과정에서 `PUBLIC_API_AUTH_KEY` 환경 변수로 전달된 공공API 인증 키가 자동으로
                MCP 서버로 전달됩니다.

        *   `src/mcp/server.ts`
            -   공공API MCP 래퍼 서버의 실제 구현이 위치한 파일입니다.
            -   `McpServer` 클래스를 상속받아 공공API MCP 래퍼 서버를 실제로 구현하는 `PublicApiMcpServer` 클래스가 위치
                합니다.
            -   공공API 목록을 구조화해서 나타내기 위한 `PublicApiEntry`, 공공API 요청 인자를 구조화해서 나타내기 위한
                `PublicApiRequestParam` 인터페이스가 위치합니다.

    *   `src/mcp/host.ts`
        -   MCP 서버 및 언어 모델과 통신하며 실제 응답(chat completion)을 생성하는 MCP 호스트의 구현이 위치한 파일입니다
            .
        -   MCP 호스트의 구현 클래스인 `PublicApiMcpHost` 클래스가 위치합니다.
        -   MCP 호스트는 생성자에서 상응하는 MCP 서버 프로세스를 자식 프로세스를 생성하며, 이 과정에서 자신의 생성자 인
            자로 받은 `PUBLIC_API_AUTH_KEY` 환경변수를 MCP 서버에 전달합니다.

-   `src/index.ts`

    -   MCP 호스트 및 서버를 포함하는 전체 백엔드 서버의 실행을 위한 인덱스 파일입니다.
    -   `npm run start` 실행시 실제로 실행되며, 실행 과정에서 MCP 호스트 인스턴스를 생성합니다.
    -   백엔드 서버와의 통신을 위한 API를 구현합니다.

-   `src/utils.ts`

    -   유틸리티 클래스, 함수, 인터페이스가 위치합니다.

-   `src/types.ts`

    -   MCP 서버 - 호스트, MCP 호스트 - 어플리케이션 서버 간 JSON 교환을 위한 스키마와 타입들이 위치하는 파일입니다.
    -   `npm install github:kimdoyoung0319/public-api-mcp`를 통해 이 레포지토리를 프로젝트 의존성에 추가한 후,
        `import { types ... } from "public-api-mcp/src/types.ts"`를 통해 해당 타입 및 스키마를 사용할 수 있습니다.

-   `src/error.ts`
    -   각종 에러 클래스가 위치합니다.

### API 명세

`root`는 전체 서비스의 루트 URL입니다. 로컬에서 테스트하는 경우, 3000번 포트를 사용하므로 `http://localhost:3000`를사용
합니다.

-   `POST {root}/chat`

    -   MCP 호스트에 대화 응답 생성을 요청합니다.
    -   요청 본문은 Ollama `ChatRequest` 타입의 JSON 데이터입니다.
    -   `ChatRequest` 타입의 속성 중 `messages`를 제외한 나머지 속성은 무시되지만, `model` 필드는 필수로 포함해야 합니다
        .
    -   Ollama `ChatResponse` 타입의 JSON 데이터 스트림을 응답으로 반환합니다.

-   `GET {root}/health`

    -   MCP 호스트의 상태 체크 API입니다.
    -   `src/types.ts`의 `HealthResponse` 타입의 JSON 데이터를 응답으로 반환합니다.

### TODO

-   [x] REST API 요청/응답 스키마 정의
-   [x] 다른 API 구현
-   [x] Ollama 로컬 모델이 아닌 원격 클라우드 모델을 이용해 응답 생성이 가능한지 테스트
-   [ ] 다른 공공API 엔트리도 활용 가능하도록 확장
    -   [ ] [행정안전부 실시간 주소정보](https://www.data.go.kr/data/15057017/openapi.do)
    -   [ ] [서울특별시 지하철 실시간 도착정보](https://www.data.go.kr/data/15058052/openapi.do)
    -   [ ] [식품의약품안전처 조리식품 레시피](https://www.data.go.kr/data/15060073/openapi.do)
    -   [ ] [한국천문연구원 특일정보](https://www.data.go.kr/data/15012690/openapi.do)
    -   [ ] [한국예탁결제원 주식정보서비스](https://www.data.go.kr/data/15001145/openapi.do)
-   [x] 공공데이터포털 API 엔드포인트 사용하도록 수정
