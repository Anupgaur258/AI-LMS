// index.js
// Install: npm install @google/genai mime dotenv

require("dotenv").config(); // load .env variables
const { GoogleGenAI } = require("@google/genai");

async function main() {
    const ai = new GoogleGenAI({
        // using NEXT_PUBLIC variable
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    });

    const tools = [{ googleSearch: {} }];
    const config = { tools };
    const model = "gemini-2.0-flash";

    const contents = [{
        role: "user",
        parts: [{
            text: "Generate a study material for Python (easy exam prep)...",
        }, ],
    }, ];

    const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
    });

    for await (const chunk of response) {
        process.stdout.write(chunk.text || "");
    }
}

main();