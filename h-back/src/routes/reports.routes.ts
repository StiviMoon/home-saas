import { Router } from "express";
import * as reportsController from "../controllers/reports.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.get("/", verifyToken, reportsController.getReports);
router.get("/statistics", verifyToken, reportsController.getReportsStatistics);
router.get("/:id", verifyToken, reportsController.getReportById);
router.post("/", verifyToken, reportsController.createReport);
router.put("/:id", verifyToken, reportsController.updateReport);
router.post("/:id/photos", verifyToken, reportsController.addPhoto);
router.post("/:id/comments", verifyToken, reportsController.addComment);
router.post("/:id/comments", verifyToken, reportsController.addComment);
router.post("/:id/photos", verifyToken, reportsController.addPhoto);

export default router;

