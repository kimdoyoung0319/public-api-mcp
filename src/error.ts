/** 필요 환경변수가 프로세스 실행 시 주어지지 않았음을 나타내는 에러 클래스. */
export class EnvError extends Error {
    /**
     * @param name 필요 환경변수의 이름.
     */
    constructor(name: string) {
        super(`환경변수 ${name}이 필요합니다.`);
        this.name = "EnvError";
    }
}

/** 필요 환경변수의 형식이 잘못되었음을 나타내기 위한 에러 클래스. */
export class EnvFormatError extends Error {
    /**
     * @param name 필요 환경변수의 이름.
     */
    constructor(name: string) {
        super(`환경변수 ${name}의 형식이 잘못되었습니다.`);
        this.name = "EnvFormatError";
    }
}

/** MCP 서버의 내부적 오류를 MCP 호스트에 전달할 때 사용하기 위한 에러 클래스. */
export class McpServerError extends Error {
    constructor() {
        super("내부 서버 오류");
        this.name = "McpServerError";
    }
}
