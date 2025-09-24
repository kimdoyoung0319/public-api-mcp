export type Msg = { role: "user" | "assistant" | "system" | "tool"; content: string };
export type Conversation = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: Msg[];
};

const KEY = "pl_conversations_v1";

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadConversations(): Conversation[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const arr: Conversation[] = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function saveConversations(list: Conversation[]) {
    localStorage.setItem(KEY, JSON.stringify(list));
}

export function createConversation(title = "새 대화"): Conversation {
    const conv: Conversation = {
        id: uid(),
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
    };
    const list = loadConversations();
    list.unshift(conv);
    saveConversations(list);
    return conv;
}

export function updateConversation(conv: Conversation) {
    const list = loadConversations();
    const idx = list.findIndex((c) => c.id === conv.id);
    if (idx >= 0) list[idx] = conv;
    else list.unshift(conv);
    saveConversations(list);
}

export function renameConversation(id: string, title: string) {
    const list = loadConversations();
    const idx = list.findIndex((c) => c.id === id);
    if (idx >= 0) {
        list[idx].title = title;
        list[idx].updatedAt = Date.now();
        saveConversations(list);
    }
}

export function deleteConversation(id: string) {
    const list = loadConversations().filter((c) => c.id !== id);
    saveConversations(list);
}

export function getConversation(id: string): Conversation | undefined {
    return loadConversations().find((c) => c.id === id);
}
