import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router: IRouter = Router();

router.post("/ai-chat", async (req, res) => {
  const { messages, context } = req.body as {
    messages: Array<{ role: "user" | "model"; content: string }>;
    context?: {
      monthlyIncome?: number;
      monthlyExpenses?: number;
      savingsRate?: number;
      balance?: number;
      budgetLimit?: number;
      budgetPercent?: number;
      topCategories?: Array<{ name: string; amount: number }>;
      goals?: Array<{ name: string; savedAmount: number; targetAmount: number }>;
      currency?: string;
    };
  };

  if (!messages?.length) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    return res.json({
      reply: "AI chat requires a Gemini API key. Add GEMINI_API_KEY in your environment secrets to enable this feature.",
      source: "fallback",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const ctx = context ?? {};
    const systemInstruction = `You are SpendWise AI, a friendly and knowledgeable personal finance coach for an Indian user. You give practical, specific, and encouraging financial advice.

User's current financial snapshot:
- Monthly Income: ₹${(ctx.monthlyIncome ?? 0).toLocaleString("en-IN")}
- Monthly Expenses: ₹${(ctx.monthlyExpenses ?? 0).toLocaleString("en-IN")}
- Current Balance: ₹${(ctx.balance ?? 0).toLocaleString("en-IN")}
- Savings Rate: ${(ctx.savingsRate ?? 0).toFixed(1)}%
- Budget: ₹${(ctx.budgetLimit ?? 0).toLocaleString("en-IN")} (${(ctx.budgetPercent ?? 0).toFixed(0)}% used)
- Top Expense Categories: ${ctx.topCategories?.map((c) => `${c.name} (₹${c.amount.toLocaleString("en-IN")})`).join(", ") || "None"}
- Financial Goals: ${ctx.goals?.map((g) => `${g.name} – ${((g.savedAmount / Math.max(g.targetAmount, 1)) * 100).toFixed(0)}% complete`).join(", ") || "No active goals"}

Guidelines:
- Be conversational, warm, and concise (2–4 sentences per response unless asked for detail)
- Reference the user's actual numbers when relevant
- Tailor advice to Indian financial products: SIP, PPF, FD, RD, NPS, ELSS, LIC, UPI
- If the user asks about investing, suggest starting with mutual funds via SIP
- Use ₹ symbol for amounts, not $ or USD
- Never give medical, legal, or tax advice
- If you don't know something, say so honestly`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    // Build history (all messages except the last user message)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage?.content ?? "");
    const reply = result.response.text();

    return res.json({ reply, source: "gemini" });
  } catch (err: any) {
    req.log.error({ err }, "AI chat error");
    return res.status(500).json({
      error: "AI chat failed",
      reply: "Sorry, I couldn't process that. Please try again in a moment.",
    });
  }
});

export default router;
