import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { createTokens } from "../utils/tokens.js";

import { authenticate } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["DRIVER", "CUSTOMER"]).optional(),
  licenseNo: z.string().optional(),
  phone: z.string().optional()
});

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ success: false, message: "Email already exists" });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const role = body.role === "DRIVER" ? "DRIVER" : "CUSTOMER";
    const user = await prisma.user.create({
      data: { fullName: body.fullName, email: body.email, passwordHash, role }
    });

    if (role === "DRIVER") {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNo: body.licenseNo || `DRV-${Date.now()}`,
          phone: body.phone || "N/A"
        }
      });
    }

    const tokens = createTokens(user);
    return res.status(201).json({ success: true, message: "Registered", data: { user, ...tokens } });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const tokens = createTokens(user);
    return res.json({ success: true, message: "Logged in", data: { user, ...tokens } });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { driver: true }
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
