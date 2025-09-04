require('dotenv').config();

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && process.env.NODE_ENV !== 'production') {
  throw new Error('GEMINI_API_KEY is not set. Add it to Vercel Dashboard (Settings > Environment Variables) or .env.local.');
}

let genAI;
try {
  genAI = new GoogleGenerativeAI(apiKey);
} catch (err) {
  console.error('Failed to initialize GoogleGenerativeAI:', err.message);
  throw new Error('Invalid GEMINI_API_KEY or initialization error');
}

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

async function generateCourseOutline(topic = 'Python') {
  try {
    const prompt = `Generate a study material for ${topic} for Exam, level of difficulty will be EASY with summary of course, List of Chapters along with summary for each chapter, Topic list in each chapter in JSON format`;

    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: JSON.stringify(
                {
                  course_title: `${topic} for Beginners`,
                  difficulty: 'Easy',
                  summary: `This course provides an introduction to the ${topic} programming language, covering the fundamentals necessary to write simple programs and understand basic programming concepts.`,
                  chapters: [
                    {
                      chapter_title: `Introduction to ${topic}`,
                      summary: `This chapter introduces the ${topic} programming language, its history, and its uses. It also covers basic syntax and the concept of variables and data types.`,
                      topics: [
                        `What is ${topic}?`,
                        `Why use ${topic}?`,
                        `Installing ${topic}`,
                        `Running ${topic} code`,
                        'Basic syntax',
                        'Variables and data types',
                        'Operators',
                      ],
                    },
                    {
                      chapter_title: 'Control Flow',
                      summary: 'This chapter covers decision-making statements and loops to control the flow of programs.',
                      topics: [
                        'If statements',
                        'If-else statements',
                        'Nested if',
                        'For loops',
                        'While loops',
                        'Break and continue',
                      ],
                    },
                    {
                      chapter_title: 'Functions',
                      summary: 'This chapter explains how to group code into reusable blocks using functions.',
                      topics: [
                        'Defining functions',
                        'Calling functions',
                        'Function arguments',
                        'Return values',
                        'Built-in functions',
                      ],
                    },
                    {
                      chapter_title: 'Data Structures',
                      summary: `This chapter explains ${topic}'s built-in data structures to store and manipulate collections of data.`,
                      topics: [
                        'Lists',
                        'Tuples',
                        'Sets',
                        'Dictionaries',
                        'List comprehensions',
                      ],
                    },
                    {
                      chapter_title: 'File Handling',
                      summary: `This chapter introduces how to read from and write to files in ${topic}.`,
                      topics: [
                        'Opening files',
                        'Reading files',
                        'Writing files',
                        'Closing files',
                      ],
                    },
                    {
                      chapter_title: 'Error Handling',
                      summary: `This chapter explains how to handle errors and exceptions in ${topic} programs.`,
                      topics: [
                        'Introduction to errors',
                        'Try and except',
                        'Finally clause',
                        'Raising exceptions',
                      ],
                    },
                  ],
                },
                null,
                2
              ),
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(
      `Generate the study material for ${topic} as requested, ensuring the response is in JSON format with the same structure as the previous response.`
    );

    const responseText = result.response.text();
    console.log('Generated Course Outline:', responseText);
    return responseText;
  } catch (err) {
    console.error('Gemini API Error:', {
      message: err.message,
      stack: err.stack,
      response: err.response ? err.response.data : null,
    });
    throw new Error(`Failed to generate course outline: ${err.message}`);
  }
}

module.exports = { generateCourseOutline };
