import { Router } from "express";
import healthRoutes from "./health.routes";
// import userRoutes from "./user.routes"; // example

const router = Router();

// Mount route modules
router.use(healthRoutes);
// router.use("/users", userRoutes); // example

export default router;
