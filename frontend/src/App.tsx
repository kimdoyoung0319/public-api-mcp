import { useState } from "react";
import { sendQuery } from "./lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export default function App() {
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSend() {
        if (!text.trim() || loading) return;
        setLoading(true);
        try {
            const res = await sendQuery(1, text.trim());
            setMsgs((m) => [...m, ...res.messages]);
            setText("");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 2000, margin: "40px auto", padding: 16 }}>
            <h2>공공 API mcp</h2>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    minHeight: 400,
                    border: "1px solid #ddd",
                    padding: 12,
                    borderRadius: 8,
                }}
            >
                {msgs.map((m, i) => (
                    <div
                        key={i}
                        style={{
                            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        }}
                    >
                        <div style={{ fontSize: 12, opacity: 0.6 }}>{m.role}</div>
                        <div
                            style={{
                                background: m.role === "user" ? "#DCF2FF" : "#F2F2F2",
                                padding: 12,
                                borderRadius: 8,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <textarea
                    rows={3}
                    style={{ flex: 1 }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="예) 서울 강남구 도서관 찾아줘"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                />
                <button onClick={onSend} disabled={loading}>
                    {loading ? "전송중..." : "전송"}
                </button>
            </div>
        </div>
    );
}
