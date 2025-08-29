import { db } from "@/config/db";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHAPTER_NOTES_TABLE, STUDY_MATERIAL_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};

export const GenerateNotes = inngest.createFunction({ id: "generate-course" }, { event: "notes.generate" },
    async({ event, step }) => {
        const course = event.data.course;

        // Check course existence
        if (!course || course.length === 0) {
            return {
                notesResult: "No course data provided",
                updateCourseStatusResult: "Skipped",
            };
        }

        const studyMaterialTable = course[0].STUDY_MATERIAL_TABLE;
        let chapters = [];
        let courseId = null;

        if (studyMaterialTable) {
            if (studyMaterialTable.courseLayout && Array.isArray(studyMaterialTable.courseLayout.chapters)) {
                chapters = studyMaterialTable.courseLayout.chapters;
            }
            courseId = studyMaterialTable.courseId || null;
        }

        // If chapters or courseId missing
        if (chapters.length === 0 || !courseId) {
            return {
                notesResult: "Missing required data",
                updateCourseStatusResult: "Skipped",
            };
        }

        const notesResult = await step.run("Generate Chapter Notes", async() => {
            const processChapter = async(chapter, index) => {
                try {
                    const chapterId = Date.now() + index;
                    const PROMPT = `
                        Generate detailed exam material content for the following chapter.
                        Include all topics and format in HTML.
                        Chapter Details: ${JSON.stringify(chapter)}
                    `;

                    const result = await model.generateContent({
                        generationConfig,
                        contents: [{ role: "user", parts: [{ text: PROMPT }] }],
                    });

                    let aiResponse = "";
                    if (result && result.response && result.response.candidates && result.response.candidates[0] &&
                        result.response.candidates[0].content && result.response.candidates[0].content.parts &&
                        result.response.candidates[0].content.parts[0] && result.response.candidates[0].content.parts[0].text) {
                        aiResponse = result.response.candidates[0].content.parts[0].text;
                    }

                    if (aiResponse !== "") {
                        await db.insert(CHAPTER_NOTES_TABLE).values({
                            chapterId,
                            courseId,
                            notes: aiResponse,
                        });
                        return { chapterId, status: "success" };
                    } else {
                        return { chapterId, status: "failed", error: "No AI response" };
                    }
                } catch (error) {
                    return {
                        chapterId: `chapter-${index}`,
                        status: "failed",
                        error: error.message || "Unknown error",
                    };
                }
            };

            const concurrencyLimit = 5;
            const batchPromises = [];

            for (let i = 0; i < chapters.length; i += concurrencyLimit) {
                const batch = chapters.slice(i, i + concurrencyLimit);
                batchPromises.push(
                    Promise.allSettled(batch.map((ch, idx) => processChapter(ch, i + idx)))
                );
            }

            const results = (await Promise.all(batchPromises)).flat();
            return results.map(res =>
                res.status === "fulfilled" ? res.value : { status: "failed", error: res.reason }
            );
        });

        let updateCourseStatusResult = "Skipped";

        if (courseId) {
            try {
                await db
                    .update(STUDY_MATERIAL_TABLE)
                    .set({ status: "Ready" })
                    .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));
                updateCourseStatusResult = "Success";
            } catch (err) {
                updateCourseStatusResult = `Failed to update status: ${err.message}`;
            }
        }

        return { notesResult, updateCourseStatusResult };
    }
);