import { Router } from "express";
import * as conjuntosController from "../controllers/conjuntos.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Ruta pública para verificar código de acceso
router.get("/code/:codigo", conjuntosController.getConjuntoByCode);

// Rutas protegidas
router.get("/", verifyToken, conjuntosController.getAllConjuntos);
router.get("/:id", verifyToken, conjuntosController.getConjuntoById);
router.post("/", verifyToken, conjuntosController.createConjunto);
router.put("/:id", verifyToken, conjuntosController.updateConjunto);
router.post("/:id/regenerate-code", verifyToken, conjuntosController.regenerateAccessCode);

export default router;

