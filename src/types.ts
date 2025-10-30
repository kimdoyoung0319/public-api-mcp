import z from "zod";

export const fooSchema = z.object({});

export type Foo = z.infer<typeof fooSchema>;

export const barSchema = z.object({});

export type Bar = z.infer<typeof fooSchema>;

/** MCP 호스트 상태 체크 API의 응답 스키마. */
export const healthResponseSchema = z.object({
    /** 현재 MCP 호스트의 상태. */
    status: z.enum(["ok", "error"]),
    /** 현재 MCP 호스트가 실행된 후 지난 초 단위의 시간. */
    uptime: z.coerce.number().optional(),
    /** MCP 호스트가 사용중인 모델. */
    model: z.string().optional(),
    /** MCP 호스트의 ISO 날짜 포맷 타임스탬프. */
    timestamp: z.coerce.date().optional(),
});

/** MCP 호스트의 상태 체크 API의 응답 타입. */
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/* 아래 스키마 및 타입들은 모두 Ollama 인터페이스에 대응됩니다. Zod 3는 인터페이스에서 스키마를 정의하는 것을 지원하지
 * 않기 때문에, 필요한 인터페이스에 대해서만 일단 직접 스키마 및 타입을 작성하였습니다. 이후 코드 작성시, Ollama
 * 타입과의 충돌 방지를 위해 타입을 Ollama에서 임포트하기보다는 현재 파일에서 임포트해주세요. 대부분의 경우, Ollama
 * API와 호환 가능합니다. */

/** Ollama `ToolCall` 타입에 해당하는 스키마. */
export const toolCallSchema = z.object({
    function: z.object({
        name: z.string(),
        arguments: z.record(z.any()),
    }),
});

/** Ollama `ToolCall` 타입. */
export type ToolCall = z.infer<typeof toolCallSchema>;

/** Ollama `Message` 타입에 해당하는 스키마. */
export const messageSchema = z.object({
    role: z.string(),
    content: z.string(),
    thinking: z.string().optional(),
    tool_calls: z.array(toolCallSchema).optional(),
    tool_name: z.string().optional(),
});

/** Ollama `Message` 타입. */
export type Message = z.infer<typeof messageSchema>;

/** Ollama `Tool` 타입에 해당하는 스키마. */
export const toolSchema = z.object({
    type: z.string(),

    function: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),

        parameters: z
            .object({
                type: z.string().optional(),
                $defs: z.any().optional(),
                items: z.any().optional(),
                required: z.array(z.string()).optional(),
                properties: z
                    .record(
                        z.object({
                            type: z.union([z.string(), z.array(z.string())]).optional(),
                            items: z.any().optional(),
                            description: z.string().optional(),
                            enum: z.array(z.any()).optional(),
                        })
                    )
                    .optional(),
            })
            .optional(),
    }),
});

/** Ollama `Tool` 타입. */
export type Tool = z.infer<typeof toolSchema>;

/** Ollama `Options` 타입에 해당하는 스키마. */
export const optionsSchema = z.object({
    numa: z.boolean(),
    num_ctx: z.number(),
    num_batch: z.number(),
    num_gpu: z.number(),
    main_gpu: z.number(),
    low_vram: z.boolean(),
    f16_kv: z.boolean(),
    logits_all: z.boolean(),
    vocab_only: z.boolean(),
    use_mmap: z.boolean(),
    use_mlock: z.boolean(),
    embedding_only: z.boolean(),
    num_thread: z.number(),
    num_keep: z.number(),
    seed: z.number(),
    num_predict: z.number(),
    top_k: z.number(),
    top_p: z.number(),
    tfs_z: z.number(),
    typical_p: z.number(),
    repeat_last_n: z.number(),
    temperature: z.number(),
    repeat_penalty: z.number(),
    presence_penalty: z.number(),
    frequency_penalty: z.number(),
    mirostat: z.number(),
    mirostat_tau: z.number(),
    mirostat_eta: z.number(),
    penalize_newline: z.boolean(),
    stop: z.array(z.string()),
});

/** Ollama `Options` 타입. */
export type Options = z.infer<typeof optionsSchema>;

/** Ollama `ChatRequest` 타입에 해당하는 스키마. */
export const chatRequestSchema = z.object({
    model: z.string(),
    messages: z.array(messageSchema).optional(),
    stream: z.boolean().optional(),
    format: z.union([z.string(), z.any()]).optional(),
    keep_alive: z.union([z.string(), z.number()]).optional(),
    tools: toolSchema.optional(),
    think: z.union([z.boolean(), z.literal("high"), z.literal("medium"), z.literal("low")]).optional(),
    options: optionsSchema.partial().optional(),
});

/** Ollama `ChatRequest` 타입. */
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Ollama `ChatResponse` 타입에 해당하는 스키마. */
export const chatResponseSchema = z.object({
    model: z.string(),
    created_at: z.coerce.date(),
    message: messageSchema,
    done: z.boolean(),
    done_reason: z.string(),
    total_duration: z.number(),
    load_duration: z.number(),
    prompt_eval_count: z.number(),
    prompt_eval_duration: z.number(),
    eval_count: z.number(),
    eval_duration: z.number(),
});

/** Ollama `ChatResponse` 타입. */
export type ChatResponse = z.infer<typeof chatResponseSchema>;
