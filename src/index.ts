import express from "express";
import { PublicApiMcpHost } from "./mcp/host.js";
import { chatRequestSchema } from "./types.js";
import { logger } from "./utils.js";

const app = express();
const port = 3000;
const host = new PublicApiMcpHost({ model: "gpt-oss:20b-cloud" });

app.use(express.json());

app.post("/chat", async (request, response) => {
    logger.debug("클라이언트 요청: ", request.body);

    const parsed = chatRequestSchema.safeParse(request.body);

    if (!parsed.success || parsed.data.messages === undefined) {
        response.status(400).send("요청 형식 오류");
        return;
    }

    response.setHeader("Content-Type", "application/json");

    for await (const chunk of host.chat(parsed.data.messages)) {
        response.write(`${JSON.stringify(chunk)}\n`);
    }

    response.end();
});

app.get("/health", async (_, response) => {
    const healthy = await host.check();

    if (host === undefined || !healthy) {
        response.json({ status: "error" });
        return;
    }

    const date = new Date();

    response.json({
        status: "ok",
        uptime: process.uptime(),
        model: host.model(),
        timestamp: date.toISOString(),
    });
});

app.listen(port);
