import type { Conversation } from "../lib/storage";

type Props = {
    items: Conversation[];
    activeId?: string;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
};

export default function Sidebar({ items, activeId, onSelect, onNew, onDelete }: Props) {
    return (
        <aside
            style={{
                width: 280,
                borderRight: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                height: "100vh",
            }}
        >
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                <button
                    onClick={onNew}
                    style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#f9fafb",
                    }}
                >
                    + 새 대화
                </button>
            </div>

            <div style={{ padding: 8, fontSize: 12, color: "#6b7280" }}>이전 대화</div>

            <div style={{ overflowY: "auto", padding: 8, flex: 1 }}>
                {items.length === 0 && (
                    <div style={{ color: "#9ca3af", fontSize: 14, padding: 8 }}>아직 대화가 없습니다.</div>
                )}
                {items.map((c) => {
                    const active = c.id === activeId;
                    return (
                        <div
                            key={c.id}
                            onClick={() => onSelect(c.id)}
                            style={{
                                padding: 10,
                                borderRadius: 8,
                                marginBottom: 6,
                                cursor: "pointer",
                                background: active ? "#e5f2ff" : "transparent",
                                border: active ? "1px solid #93c5fd" : "1px solid transparent",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 190,
                                }}
                            >
                                {c.title || "제목 없음"}
                            </div>
                            <button
                                title="삭제"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(c.id);
                                }}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#9ca3af",
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
