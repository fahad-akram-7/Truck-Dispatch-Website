import { Router } from "express";
import { prisma } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.post("/generate/:loadId", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const load = await prisma.loadRequest.findUnique({ where: { id: req.params.loadId } });
    if (!load) return res.status(404).json({ success: false, message: "Load not found" });

    const baseCost = load.distanceKm * 2.5;
    const weightCharge = load.weightKg * 0.1;
    const fuelSurcharge = baseCost * 0.15;
    const priorityCharge = load.priority === "EXPRESS" ? 150 : 0;
    const totalAmount = baseCost + weightCharge + fuelSurcharge + priorityCharge;

    const quote = await prisma.quote.upsert({
      where: { loadRequestId: load.id },
      update: { baseCost, weightCharge, fuelSurcharge, priorityCharge, totalAmount },
      create: {
        loadRequestId: load.id,
        baseCost,
        weightCharge,
        fuelSurcharge,
        priorityCharge,
        totalAmount,
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.loadRequest.update({ where: { id: load.id }, data: { status: "QUOTED" } });
    return res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
});

router.get("/:loadId", async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({ where: { loadRequestId: req.params.loadId } });
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });
    return res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
});

export default router;
