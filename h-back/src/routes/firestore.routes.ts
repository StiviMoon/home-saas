import { Router, Request, Response } from "express";
import { adminDb } from "../config/firebase";
import { verifyToken } from "../middleware/auth.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

const router = Router();

/**
 * Verifica la conexión a Firestore
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    // Intentar leer una colección para verificar conexión
    const testRef = adminDb.collection("_test");
    await testRef.limit(1).get();

    return res.status(200).json({
      success: true,
      message: "Conexión a Firestore establecida correctamente",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al conectar con Firestore",
      details: error.message,
    });
  }
});

/**
 * Obtiene información sobre la colección de usuarios
 */
router.get("/users/info", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const usersRef = adminDb.collection("usuarios");
    const countSnapshot = await usersRef.count().get();
    const count = countSnapshot.data().count;

    // Obtener un ejemplo de documento
    const exampleSnapshot = await usersRef.limit(1).get();
    let example = null;
    if (!exampleSnapshot.empty) {
      const doc = exampleSnapshot.docs[0];
      example = {
        id: doc.id,
        ...doc.data(),
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        collection: "usuarios",
        exists: count > 0,
        totalDocuments: count,
        example: example,
        structure: {
          id: "string (auth_id)",
          auth_id: "string",
          email: "string",
          nombre: "string",
          conjunto_id: "string | null",
          unidad: "string | null",
          rol: "residente | admin | super_admin",
          created_at: "Timestamp",
          updated_at: "Timestamp",
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener información de la colección",
      details: error.message,
    });
  }
});

export default router;

