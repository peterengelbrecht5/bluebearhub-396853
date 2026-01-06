import OpenAI from "openai";
import { batchProcess } from "../batch/index";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function runAutomationTask(items: any[], instruction: string) {
  return await batchProcess(
    items,
    async (item) => {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are an AI automation assistant. Follow the instructions precisely." },
          { role: "user", content: `Instruction: ${instruction}\n\nItem: ${JSON.stringify(item)}` }
        ],
        response_format: { type: "json_object" },
      });
      return JSON.parse(response.choices[0]?.message?.content || "{}");
    },
    { concurrency: 5, retries: 3 }
  );
}
