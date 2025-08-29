import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "ai-lms",
    eventKey: process.env.INNGEST_EVENT_KEY, // yahi key use karo
});