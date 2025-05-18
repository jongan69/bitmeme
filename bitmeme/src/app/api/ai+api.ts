import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const responseSchema = z.object({
  template: z.string(),
  top_text: z.string(),
  bottom_text: z.string(),
});

export async function POST(req: Request) {
  const { content } = await req.json();

  if (!content) {
    return new Response("No content provided", { status: 400 });
  }

  try {
    // Fetch meme templates and randomly select a subset
    const templatesRes = await fetch("https://api.memegen.link/templates/");
    const templates = await templatesRes.json();
    // Randomly pick 20 templates
    const shuffled = templates.sort(() => 0.5 - Math.random());
    const pickedTemplates = shuffled.slice(0, 20);
    const templatePairs = pickedTemplates.map((t: any) => `${t.id} (${t.name})`);
    const templateList = templatePairs.join(", ");
    
    // Debug: log picked templates
    console.log("Picked meme templates:", templateList);

    // Update response schema to allow multiple suggestions
    const multiResponseSchema = z.object({
      memes: z.array(z.object({
        template: z.string(),
        top_text: z.string(),
        bottom_text: z.string(),
      }))
    });

    // Setup streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Debug: log system prompt
    const systemPrompt = `You are a meme generator assistant. Here is a list of valid meme templates: [${templateList}]. Given a meme idea, suggest up to 10 possible memes using these templates (by id), and provide the top and bottom text for each. Respond in JSON: { "memes": [ { "template": "...", "top_text": "...", "bottom_text": "..." }, ... ] }`;
    console.log("System prompt for AI:\n", systemPrompt);

    // Chat stream
    openai.beta.chat.completions
      .stream({
        model: "gpt-4o-2024-11-20",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Meme idea: ${content}`,
          },
        ],
        response_format: zodResponseFormat(multiResponseSchema, "post"),
      })
      .on(
        "content.delta",
        async ({ snapshot, parsed }) => {
          // Debug: log parsed AI response chunk
        //   console.log("AI response chunk:", parsed);
          await writer.write(encoder.encode(JSON.stringify(parsed)));
        }
      )
      .on("content.done", async () => await writer.close());

    // Return the readable stream
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
}