import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

const loadSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  weightKg: z.number().positive(),
  distanceKm: z.number().positive(),
  priority: z.enum(["STANDARD", "EXPRESS"]).optional(),
  requestedDate: z.string().datetime(),
  notes: z.string().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const body = loadSchema.parse(req.body);
    const created = await prisma.loadRequest.create({
      data: {
        ...body,
        priority: body.priority ?? "STANDARD",
        requestedDate: new Date(body.requestedDate)
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.get("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const rows = await prisma.loadRequest.findMany({
      include: { quote: true, dispatch: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/track/:id", async (req, res, next) => {
  try {
    const customerEmail = String(req.query.email || "").trim();
    if (!customerEmail) {
      return res.status(400).json({ success: false, message: "Customer email is required" });
    }

    const load = await prisma.loadRequest.findFirst({
      where: { id: req.params.id, customerEmail },
      include: {
        quote: true,
        dispatch: {
          include: {
            driver: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!load) return res.status(404).json({ success: false, message: "Request not found" });
    return res.json({ success: true, data: load });
  } catch (err) {
    next(err);
  }
});

export default router;
