import { useState } from "react";

export default function ChatInput({ onSend, disabled }: { onSend: (t: string) => void; disabled?: boolean }) {
    const [text, setText] = useState("");
    function submit() {
        const v = text.trim();
        if (!v || disabled) return;
        onSend(v);
        setText("");
    }
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                borderTop: "1px solid #e5e7eb",
                paddingTop: 12,
                background: "#fff",
                position: "sticky",
                bottom: 0,
            }}
        >
            <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="무엇이든 물어보세요… 예) 서울 강남구 도서관 찾아줘"
                style={{ flex: 1, resize: "vertical", padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                    }
                }}
            />
            <button
                onClick={submit}
                disabled={disabled}
                style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #3b82f6",
                    background: "#3b82f6",
                    color: "#fff",
                }}
            >
                보내기
            </button>
        </div>
    );
}
