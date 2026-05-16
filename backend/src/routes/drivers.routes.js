import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", async (req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({ include: { user: true } });
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
});

const createDriverSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(7),
  licenseNo: z.string().min(3),
  currentCity: z.string().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const body = createDriverSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ success: false, message: "Email already exists" });

    const passwordHash = await import("bcryptjs").then((m) => m.default.hash(body.password, 10));
    const user = await prisma.user.create({
      data: { fullName: body.fullName, email: body.email, passwordHash, role: "DRIVER" }
    });
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        phone: body.phone,
        licenseNo: body.licenseNo,
        currentCity: body.currentCity
      },
      include: { user: true }
    });
    res.status(201).json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const schema = z.object({
      phone: z.string().optional(),
      availability: z.string().optional(),
      currentCity: z.string().optional()
    });
    const body = schema.parse(req.body);
    const updated = await prisma.driver.update({ where: { id: req.params.id }, data: body });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Driver deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
