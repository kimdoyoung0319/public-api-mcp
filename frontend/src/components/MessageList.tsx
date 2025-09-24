import type { Msg } from "../lib/storage";

export default function MessageList({ messages }: { messages: Msg[] }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: 720 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{m.role}</div>
                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background: m.role === "user" ? "#DCF2FF" : "#F2F2F2",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.5,
                        }}
                    >
                        {m.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
