import { Router, Request, Response } from "express";
import usersRoutes from "./users.routes";
import firestoreRoutes from "./firestore.routes";
import conjuntosRoutes from "./conjuntos.routes";
import reportsRoutes from "./reports.routes";

const router = Router();

// Health check
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
router.use("/users", usersRoutes);
router.use("/firestore", firestoreRoutes);
router.use("/conjuntos", conjuntosRoutes);
router.use("/reports", reportsRoutes);

export default router;

