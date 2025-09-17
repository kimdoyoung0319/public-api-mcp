const BASE = "http://localhost:7070";

export async function sendQuery(convId: number, text: string) {
    const r = await fetch(`${BASE}/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ convId, text }),
    });
    return r.json();
}
