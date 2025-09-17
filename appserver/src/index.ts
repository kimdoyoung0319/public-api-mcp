import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
app.use(express.json());

// 헬스체크
app.get("/health", (_req, res) => res.json({ ok: true }));

// (임시) 채팅 에코 API
app.post("/chat/query", (req, res) => {
    const schema = z.object({ text: z.string().min(1) });
    const { text } = schema.parse(req.body ?? {});
    res.json({
        messages: [
            { role: "user", content: text },
            { role: "assistant", content: `요청을 받았습니다: "${text}"` },
        ],
    });
});

const PORT = Number(process.env.PORT ?? 7070);
app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});
