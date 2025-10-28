import express from "express";
import { PublicApiMcpHost } from "./mcp/host.js";
import { messageSchema } from "./types.js";
import z from "zod";

const app = express();
const port = 3000;
const host = new PublicApiMcpHost({ model: "gpt-oss:20b-cloud" });

app.use(express.json());

app.post("/chat", async (request, response) => {
    if (request.body.messages === undefined || z.array(messageSchema).safeParse(request.body.messages)) {
        response.status(400).send("요청 형식 오류");
    }

    response.setHeader("Content-Type", "application/json");

    for await (const chunk of host.chat(request.body.messages)) {
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
