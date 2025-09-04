import { generateCourseOutline } from '../../../config/AiModel';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Topic must be a non-empty string' }), {
        status: 400,
      });
    }

    const result = await generateCourseOutline(body.topic);

    return new Response(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('API Route Error:', {
      message: err.message,
      stack: err.stack,
    });
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
