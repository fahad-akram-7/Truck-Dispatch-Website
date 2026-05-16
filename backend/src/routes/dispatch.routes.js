import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const rows = await prisma.dispatch.findMany({
      include: {
        driver: { include: { user: true } },
        loadRequest: true
      },
      orderBy: { assignedAt: "desc" }
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/my-assignments", authenticate, authorize("DRIVER"), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { userId: req.user.sub } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found" });

    const rows = await prisma.dispatch.findMany({
      where: { driverId: driver.id },
      include: { loadRequest: true },
      orderBy: { assignedAt: "desc" }
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/assign", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const schema = z.object({
      loadRequestId: z.string().min(1),
      driverId: z.string().min(1),
      etaDate: z.string().datetime().optional()
    });
    const body = schema.parse(req.body);

    const dispatch = await prisma.dispatch.upsert({
      where: { loadRequestId: body.loadRequestId },
      update: {
        driverId: body.driverId,
        assignedById: req.user.sub,
        etaDate: body.etaDate ? new Date(body.etaDate) : null,
        currentStatus: "ASSIGNED"
      },
      create: {
        loadRequestId: body.loadRequestId,
        driverId: body.driverId,
        assignedById: req.user.sub,
        etaDate: body.etaDate ? new Date(body.etaDate) : null
      }
    });

    await prisma.loadRequest.update({
      where: { id: body.loadRequestId },
      data: { status: "ASSIGNED" }
    });

    res.status(201).json({ success: true, data: dispatch });
  } catch (err) {
    next(err);
  }
});

router.put("/:id/status", authenticate, authorize("ADMIN", "DRIVER"), async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
      note: z.string().optional()
    });
    const body = schema.parse(req.body);

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: req.params.id },
      include: { driver: true }
    });
    if (!dispatch) return res.status(404).json({ success: false, message: "Dispatch not found" });

    if (req.user.role === "DRIVER") {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.sub } });
      if (!driver || driver.id !== dispatch.driverId) {
        return res.status(403).json({ success: false, message: "Not your assigned dispatch" });
      }
    }

    const updated = await prisma.dispatch.update({
      where: { id: req.params.id },
      data: { currentStatus: body.status }
    });

    await prisma.loadRequest.update({
      where: { id: updated.loadRequestId },
      data: { status: body.status }
    });

    await prisma.statusLog.create({
      data: {
        dispatchId: updated.id,
        status: body.status,
        note: body.note,
        updatedById: req.user.sub
      }
    });

    if (req.app.get("io")) {
      req.app.get("io").emit("dispatch:status", {
        dispatchId: updated.id,
        status: body.status,
        note: body.note || null
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/timeline", authenticate, async (req, res, next) => {
  try {
    const logs = await prisma.statusLog.findMany({
      where: { dispatchId: req.params.id },
      orderBy: { timestamp: "asc" }
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
