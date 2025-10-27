# 삼성 SDS 클라우드기반 공공IT서비스

## MCP 호스트 및 서버

### 의존성

해당 서버를 구동하기 위해서는 다음이 필요합니다.

-   [Ollama](https://ollama.com) 및 `gpt-oss:20b` 모델

    -   `src/index.ts`에서 `PublicApiMcpHost` 클래스 생성자의 `models` 인자를 수정하여 다른 모델을 사용할 수도 있습니다.
    -   현재 설치된 모델 목록은 `ollama list`로 확인할 수 있습니다.
    -   `models` 인자는 `ollama list` 실행시 `NAME` 필드로 나타나는 모델 이름이어야 합니다.
    -   `ollama pull {model_name}`으로 필요한 모델을 설치할 수 있습니다.
    -   모델은 반드시 MCP Tool을 지원해야 합니다. [이 링크](https://ollama.com/search?c=tools)에서 Tool 지원 모델의 목록을 확인할 수 있습니다.

-   `npm 11.4.2` 혹은 더 최신의 버전
-   `node v24.3.0` 혹은 더 최신의 버전

### 서버 구동

서버를 실행하기 이전에 Ollama가 실행중인지 확인해야 합니다.

```
ps aux | grep ollama | grep -v grep
```

만약 해당 커맨드 실행 결과로 Ollama 프로세스가 확인되지 않는다면, `ollama serve`로 Ollama 프로세스를 실행해 주세요.

Ollama 실행 및 사용할 모델의 준비가 끝났다면, 다음을 이용해 MCP 호스트를 실행할 수 있습니다.

```
PUBLIC_API_AUTH_KEY={your_authentication_key} npm run start
```

`your_authentication_key`에는 [공공데이터포털](http://www.data.go.kr)에서 발급받은 인증 키를 입력해야 하며, 해당 인증 키를 발급받은 계정은 반드시 필요한 API에 대한 사용신청과 승인이 되어있어햐 합니다.

### 디렉터리 구조

-   `src/mcp`

    -   공공API의 MCP 래퍼와 관련된 MCP 서버 및 호스트 관련 파일들이 위치합니다.

    *   `src/mcp/server`

        -   공공API MCP 래퍼 서버 구현에 관련된 파일들이 위치합니다.

        *   `src/mcp/index.ts`

            -   공공API MCP 래퍼 서버의 실행을 위한 인덱스 파일입니다.
            -   일반적으로는 `npm run start` 실행시, MCP 호스트가 구동 과정에서 자동으로 대응되는 MCP 서버를 실행하므로 따로 해당 스크립트를 Node.js로 실행할 필요는 없습니다.
            -   또한, `npm run start` 실행 과정에서 `PUBLIC_API_AUTH_KEY` 환경 변수로 전달된 공공API 인증 키가 자동으로 MCP 서버로 전달됩니다.

        *   `src/mcp/server.ts`
            -   공공API MCP 래퍼 서버의 실제 구현이 위치한 파일입니다.
            -   `McpServer` 클래스를 상속받아 공공API MCP 래퍼 서버를 실제로 구현하는 `PublicApiMcpServer` 클래스가 위치합니다.
            -   공공API 목록을 구조화해서 나타내기 위한 `PublicApiEntry`, 공공API 요청 인자를 구조화해서 나타내기 위한 `PublicApiRequestParam` 인터페이스가 위치합니다.

    *   `src/mcp/host.ts`
        -   MCP 서버 및 언어 모델과 통신하며 실제 응답(chat completion)을 생성하는 MCP 호스트의 구현이 위치한 파일입니다.
        -   MCP 호스트의 구현 클래스인 `PublicApiMcpHost` 클래스가 위치합니다.
        -   MCP 호스트는 생성자에서 상응하는 MCP 서버 프로세스를 자식 프로세스를 생성하며, 이 과정에서 자신의 생성자 인자로 받은 `PUBLIC_API_AUTH_KEY` 환경변수를 MCP 서버에 전달합니다.

-   `src/index.ts`

    -   MCP 호스트 및 서버를 포함하는 전체 백엔드 서버의 실행을 위한 인덱스 파일입니다.
    -   `npm run start` 실행시 실제로 실행되며, 실행 과정에서 MCP 호스트 인스턴스를 생성합니다.
    -   백엔드 서버와의 통신을 위한 API를 구현합니다.

-   `src/utils.ts`
    -   유틸리티 클래스, 함수, 인터페이스가 위치합니다.

### API 명세

`root`는 전체 서비스의 루트 URL입니다. 로컬에서 테스트하는 경우, 3000번 포트를 사용하므로 `http://localhost:3000`를
사용합니다. `uuid`는 해당 대화 세션에 대한 UUID (Universally Unique IDentifier)입니다.

-   `POST {root}`
-   `GET {root}`

-   `GET {root}/chat`

    -   새로운 대화 세션을 만들고, 해당 채팅 세션 URL로 리다이렉트합니다.

-   `POST {root}/chat`

    -   새로운 대화 세션을 만들고, 해당 채팅 세션 URL로 리다이렉트하며, 모델에 응답 생성을 요청합니다.

-   `GET {root}/chat/{uuid}`

    -   해당 대화 세션의 대화 내역을 반환합니다.

-   `POST {root}/chat/{uuid}`

    -   해당 대화 세션의 맥락(context)에서 모델에 응답 생성을 요청합니다.

### TODO

-   REST API 요청/응답 스키마 정의
-   Ollama 로컬 모델이 아닌 원격 클라우드 모델을 이용해 응답 생성이 가능한지 테스트
-   다른 공공API 엔트리도 활용 가능하도록 확장
