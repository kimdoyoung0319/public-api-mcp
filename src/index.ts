import express from "express";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { PublicApiMcpHost } from "./mcp/host.js";

const app = express();
const port = 3000;
const host = new PublicApiMcpHost({
    model: "gpt-oss:20b",
});

app.use(express.text());

app.post("/", (request, response) => {
    const uuid = uuidv4();
    response.redirect(307, `/chat/${uuid}`);
});

// TODO: Implement another callback for GET request.
app.get("/chat/:uuid", handler);
app.post("/chat/:uuid", handler);

app.listen(port);

async function handler(request: Request, response: Response) {
    const uuid = request.params.uuid;
    const replies = host.chat(request.body);

    for await (const reply of replies) {
        response.write(reply);
    }

    response.end();
}
