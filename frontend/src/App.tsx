import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { sendQuery } from "./lib/api";
import type { Conversation, Msg } from "./lib/storage";
import {
    loadConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    getConversation,
    renameConversation,
} from "./lib/storage";

export default function App() {
    const [convs, setConvs] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string>();
    const [loading, setLoading] = useState(false);

    // 초기 로드
    useEffect(() => {
        const list = loadConversations();
        if (list.length === 0) {
            const c = createConversation("새 대화");
            setConvs(loadConversations());
            setActiveId(c.id);
        } else {
            setConvs(list);
            setActiveId(list[0].id);
        }
    }, []);

    const activeConv = useMemo(() => convs.find((c) => c.id === activeId), [convs, activeId]);

    async function onSend(text: string) {
        if (!activeConv || loading) return;
        setLoading(true);
        try {
            // 1) 사용자 메시지 반영
            const userMsg: Msg = { role: "user", content: text };
            const updated: Conversation = {
                ...activeConv,
                messages: [...activeConv.messages, userMsg],
                updatedAt: Date.now(),
            };
            updateConversation(updated);
            setConvs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

            // 2) 서버 호출 (더미 응답)
            const res = await sendQuery(text);
            const asst = res?.messages?.find((x: any) => x.role === "assistant");
            if (asst) {
                const withAsst: Conversation = {
                    ...updated,
                    messages: [...updated.messages, { role: "assistant", content: asst.content }],
                    updatedAt: Date.now(),
                };
                // 첫 질문이면 제목 자동 생성(사용자 입력 앞부분)
                if (withAsst.messages.length === 2 && (!withAsst.title || withAsst.title === "새 대화")) {
                    const autoTitle = text.slice(0, 30);
                    renameConversation(withAsst.id, autoTitle);
                    setConvs(loadConversations());
                } else {
                    updateConversation(withAsst);
                    setConvs((prev) => prev.map((c) => (c.id === withAsst.id ? withAsst : c)));
                }
            }
        } finally {
            setLoading(false);
        }
    }

    function onNew() {
        const c = createConversation("새 대화");
        setConvs(loadConversations());
        setActiveId(c.id);
    }

    function onSelect(id: string) {
        setActiveId(id);
    }

    function onDelete(id: string) {
        deleteConversation(id);
        const list = loadConversations();
        setConvs(list);
        if (list.length) setActiveId(list[0].id);
        else {
            const c = createConversation("새 대화");
            setConvs(loadConversations());
            setActiveId(c.id);
        }
    }

    return (
        <div style={{ display: "flex", height: "100vh", background: "#fafafa" }}>
            <Sidebar items={convs} activeId={activeId} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* 헤더 */}
                <div
                    style={{
                        height: 56,
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        background: "#ffffff",
                    }}
                >
                    <div style={{ fontWeight: 600 }}>공공 api mcp</div>
                </div>

                {/* 채팅 영역 */}
                <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                    {activeConv && activeConv.messages.length > 0 ? (
                        <MessageList messages={activeConv.messages} />
                    ) : (
                        <div style={{ color: "#9ca3af", marginTop: 80, textAlign: "center" }}>
                            왼쪽에서 대화를 선택하거나, 아래 입력창에 질문을 입력해 시작하세요.
                        </div>
                    )}
                </div>

                {/* 입력 */}
                <div style={{ padding: "12px 24px", background: "#fff" }}>
                    <ChatInput onSend={onSend} disabled={loading || !activeConv} />
                </div>
            </main>
        </div>
    );
}
