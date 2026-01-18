import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Middleware para verificar el token de autenticación de Firebase
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No se proporcionó un token de autenticación",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: "Token inválido o expirado",
      details: error.message,
    });
  }
};

