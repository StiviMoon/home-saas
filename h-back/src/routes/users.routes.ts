import { Router } from "express";
import * as usersController from "../controllers/users.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Rutas protegidas (requieren autenticación)
router.get("/me", verifyToken, usersController.getCurrentUser);
router.get("/all", verifyToken, usersController.getAllUsers); // Solo super admin
router.post("/assign-admin", verifyToken, usersController.assignAdminRole); // Solo super admin
router.delete("/:id", verifyToken, usersController.deleteUser); // Solo super admin
router.get("/conjunto/:conjuntoId", verifyToken, usersController.getUsersByConjunto);
router.get("/:id", verifyToken, usersController.getUserById);
router.put("/:id", verifyToken, usersController.updateUser);

// Ruta pública para crear usuario (se usará después del registro en Firebase Auth)
router.post("/", usersController.createUser);

export default router;

