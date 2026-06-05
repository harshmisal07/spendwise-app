import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router: IRouter = Router();

function getRuleBasedInsights(data: any): string[] {
  const insights: string[] = [];
  const { savingsRate, budgetPercent, budgetLimit, monthlyExpenses, monthlyIncome, topCategories, goals } = data;

  if (savingsRate >= 20) {
    insights.push(`Excellent savings rate of ${savingsRate.toFixed(0)}%! You're well above the recommended 20%. Consider investing the surplus in mutual funds or SIP.`);
  } else if (savingsRate < 10) {
    insights.push(`Your savings rate is ${savingsRate.toFixed(0)}%, which is below the recommended 10–20%. Try automating a fixed savings transfer at the start of each month.`);
  }

  if (budgetLimit > 0 && budgetPercent > 85) {
    insights.push(`You've used ${budgetPercent.toFixed(0)}% of your monthly budget. To stay on track, reduce discretionary spending like entertainment and dining out for the rest of the month.`);
  }

  if (topCategories && topCategories.length > 0) {
    const top = topCategories[0];
    insights.push(`Your biggest expense category is "${top.name}" at ₹${top.amount.toLocaleString()}. A 10% reduction would save ₹${(top.amount * 0.1).toLocaleString()} per month.`);
  }

  if (goals && goals.length > 0) {
    const nearGoal = goals.find((g: any) => (g.savedAmount / g.targetAmount) >= 0.75);
    if (nearGoal) {
      insights.push(`You're ${((nearGoal.savedAmount / nearGoal.targetAmount) * 100).toFixed(0)}% of the way to your "${nearGoal.name}" goal. A final push of ₹${(nearGoal.targetAmount - nearGoal.savedAmount).toLocaleString()} will complete it!`);
    }
  }

  if (monthlyIncome > 0 && monthlyExpenses > monthlyIncome * 0.7) {
    insights.push("You're spending over 70% of your monthly income. Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.");
  }

  insights.push("Review your recurring subscriptions monthly. On average, people forget ₹500–₹2,000 in unused subscriptions every month.");

  return insights.slice(0, 5);
}

router.post("/ai-insights", async (req, res) => {
  try {
    const data = req.body;

    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey) {
      return res.json({
        insights: getRuleBasedInsights(data),
        source: "rule-based",
        message: "AI insights powered by rule-based engine. Add GEMINI_API_KEY for personalized AI analysis.",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a personal finance coach for an Indian user. Analyze this financial data and provide 5 specific, actionable, personalized insights:

Financial Summary:
- Monthly Income: ₹${data.monthlyIncome?.toLocaleString() ?? 0}
- Monthly Expenses: ₹${data.monthlyExpenses?.toLocaleString() ?? 0}
- Savings Rate: ${data.savingsRate?.toFixed(1) ?? 0}%
- Budget Used: ${data.budgetPercent?.toFixed(0) ?? 0}% of ₹${data.budgetLimit?.toLocaleString() ?? 0} budget
- Total Balance: ₹${data.balance?.toLocaleString() ?? 0}
- Top Expense Categories: ${data.topCategories?.map((c: any) => `${c.name} (₹${c.amount.toLocaleString()})`).join(", ") ?? "None"}
- Active Goals: ${data.goals?.map((g: any) => `${g.name} (${((g.savedAmount / g.targetAmount) * 100).toFixed(0)}% done)`).join(", ") ?? "None"}
- Transaction Count: ${data.transactionCount ?? 0}

Provide exactly 5 insights as a JSON array of strings. Each insight should be:
1. Specific to their actual numbers
2. Actionable with a concrete step
3. Encouraging but honest
4. Relevant to Indian financial context (mention SIP, PPF, FD where relevant)
5. Under 80 words each

Respond ONLY with a valid JSON array: ["insight1", "insight2", "insight3", "insight4", "insight5"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let insights: string[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        insights = getRuleBasedInsights(data);
      }
    } catch {
      insights = getRuleBasedInsights(data);
    }

    return res.json({ insights, source: "gemini" });
  } catch (err: any) {
    req.log.error({ err }, "AI insights error");
    const data = req.body;
    return res.json({
      insights: getRuleBasedInsights(data),
      source: "rule-based",
      message: "Using rule-based insights.",
    });
  }
});

export default router;
