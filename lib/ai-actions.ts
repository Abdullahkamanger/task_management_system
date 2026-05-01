'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateSubtasks(taskTitle: string, taskDesc:string) {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" ,
    generationConfig: { responseMimeType: "application/json" }
    }); 
//gemini-3-flash if my free tier ends
  const prompt = `Break down the following task into 4-5 small, actionable sub-tasks for a productivity app: "${taskTitle}${taskDesc ? ` : ${taskDesc}` : ''}". 
  Return ONLY a plain JSON array of strings. No markdown, no numbering, no explanation. Just the array. Example: ["Task 1", "Task 2"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Attempt to extract JSON if the AI included markdown wrappers or extra text
    let jsonString = text;
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonString = text.substring(firstBracket, lastBracket + 1);
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to find the first complete array
      const match = text.match(/\[(?:[^[\]]|\[[^[\]]*\])*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (e) {
    console.error("AI Generation failed:", e);
    // Fallback if AI output isn't clean JSON
    return [];
  }
}
export async function parseNaturalLanguageTask(input: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    Extract task details from this sentence: "${input}".
    The current date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
    The current time is ${new Date().toLocaleTimeString('en-US', { hour12: false })}.
    
    Return ONLY a JSON object with:
    - title: (string)
    - description: (A detailed, step-by-step guide or efficiency tips for this task. If the user provided specific details, incorporate them. If the user only provided a title, generate a smart, actionable 3-4 step plan to complete this task effectively. Format it as a clear list.)
    - dueDate: (string "YYYY-MM-DD" or null if not mentioned)
    
    If a relative time like "tomorrow" or "next Friday" is mentioned, calculate the exact date based on the current date provided.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    let jsonString = text;
    const firstBracket = text.indexOf('{');
    const lastBracket = text.lastIndexOf('}');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonString = text.substring(firstBracket, lastBracket + 1);
    }
    
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Natural language parsing failed:", e);
    throw e;
  }
}
