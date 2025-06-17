import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).send("✅ Server is healthy!");
});

export default router;
