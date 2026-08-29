import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not defined on the server." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Prepare conversation history
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const systemInstruction = `You are a warm, helpful, polite AI Student Support Coordinator for "Campus Cakes" (the elite college-campus-focused bakery service).

Key Services of Campus Cakes:
1. Pre-Order Catalog (Guaranteed next-day delivery): We deliver premium custom photo and themed celebration cakes directly to dorm coordinates and student clubs under our "Delivery Hub" program. Needs 24-hours advance prep.
2. VIP XP Loyalty Program: Awarded for student purchases (recently initialized for live deployment) where student builders earn higher tiers and elite discounts.

Policies for Student Queries:
- Delivery Hours: 08:00 AM to 11:30 PM.
- Preparation Period: Custom cakes require 24 hours prep.
- Damage / Compensation: If a cake arrives damaged, immediately direct the student to notify the coordinator via +91 99887 76655. We replace cakes fully or process a 100% cash-back refund.
- Language/Vibe: Enthusiastic, empathetic, brief, collegiate, extremely reassuring. Never fabricate order numbers. Refer issues to Campus Cakes staff if too complex.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error("Error in Vercel AI support chat:", err);
    return res.status(500).json({ error: err.message || "An error occurred in server-side AI generation." });
  }
}
