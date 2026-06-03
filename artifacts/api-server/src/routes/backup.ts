import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cloudBackupsTable } from "@workspace/db";

const router: IRouter = Router();

function isValidPayload(body: unknown): body is { transactions: unknown[]; goals: unknown[]; categoryBudgets: unknown[]; currency: string } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return Array.isArray(b["transactions"]) && Array.isArray(b["goals"]) && Array.isArray(b["categoryBudgets"]) && typeof b["currency"] === "string";
}

// GET /api/backup/:userId — fetch cloud backup
router.get("/backup/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const rows = await db.select().from(cloudBackupsTable).where(eq(cloudBackupsTable.userId, userId));
    if (rows.length === 0) {
      res.status(404).json({ error: "No backup found" });
      return;
    }
    const row = rows[0]!;
    res.json({
      transactions:    row.transactions,
      goals:           row.goals,
      categoryBudgets: row.categoryBudgets,
      currency:        row.currency,
      backedUpAt:      row.backedUpAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch backup");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/backup/:userId — save / update cloud backup
router.post("/backup/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidPayload(req.body)) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const { transactions, goals, categoryBudgets, currency } = req.body;
    await db
      .insert(cloudBackupsTable)
      .values({ userId, transactions, goals, categoryBudgets, currency })
      .onConflictDoUpdate({
        target: cloudBackupsTable.userId,
        set: { transactions, goals, categoryBudgets, currency, backedUpAt: new Date() },
      });
    res.json({ success: true, backedUpAt: new Date() });
  } catch (err) {
    req.log.error({ err }, "Failed to save backup");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
