'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateSubtasks(taskTitle: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
//gemini-3-flash if my free tier ends
  const prompt = `Break down the following task into 4-5 small, actionable sub-tasks for a productivity app: "${taskTitle}". 
  Return ONLY a plain JSON array of strings. No markdown, no numbering, no explanation. Just the array. Example: ["Task 1", "Task 2"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Attempt to extract JSON if the AI included markdown wrappers
    const jsonMatch = text.match(/\[.*\]/s);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("AI Generation failed:", e);
    // Fallback if AI output isn't clean JSON
    return [];
  }
}
