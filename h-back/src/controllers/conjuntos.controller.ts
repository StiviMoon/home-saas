import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as conjuntosService from "../services/conjuntos.service";
import * as usersService from "../services/users.service";
import type { CreateConjuntoData, UpdateConjuntoData } from "../types/conjunto";

/**
 * Crea un nuevo conjunto (solo super_admin)
 */
export const createConjunto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    // Verificar que sea super_admin
    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser || currentUser.rol !== "super_admin") {
      return res.status(403).json({
        success: false,
        error: "Solo los super administradores pueden crear conjuntos",
      });
    }

    const conjuntoData: CreateConjuntoData = req.body;

    if (!conjuntoData.nombre || !conjuntoData.direccion || !conjuntoData.ciudad) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: nombre, direccion, ciudad",
      });
    }

    const conjunto = await conjuntosService.createConjunto(conjuntoData);

    return res.status(201).json({
      success: true,
      data: conjunto,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al crear el conjunto",
      details: error.message,
    });
  }
};

/**
 * Obtiene un conjunto por código de acceso (ruta pública)
 */
export const getConjuntoByCode = async (req: Request, res: Response) => {
  try {
    const codigo = Array.isArray(req.params.codigo) ? req.params.codigo[0] : req.params.codigo;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: "Código de acceso requerido",
      });
    }

    const conjunto = await conjuntosService.getConjuntoByCode(codigo);

    if (!conjunto) {
      return res.status(404).json({
        success: false,
        error: "Código de acceso inválido",
      });
    }

    // Convertir Timestamp a ISO string para JSON
    const conjuntoResponse = {
      id: conjunto.id,
      nombre: conjunto.nombre,
      direccion: conjunto.direccion,
      ciudad: conjunto.ciudad,
      codigo_acceso: conjunto.codigo_acceso,
      created_at: conjunto.created_at instanceof Date 
        ? conjunto.created_at.toISOString()
        : new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: conjuntoResponse,
    });
  } catch (error: any) {
    console.error("Error al obtener conjunto por código:", error);
    return res.status(500).json({
      success: false,
      error: "Error al obtener el conjunto",
      details: error.message,
    });
  }
};

/**
 * Obtiene un conjunto por ID
 */
export const getConjuntoById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID de conjunto requerido",
      });
    }

    const conjunto = await conjuntosService.getConjuntoById(id);

    if (!conjunto) {
      return res.status(404).json({
        success: false,
        error: "Conjunto no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: conjunto,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener el conjunto",
      details: error.message,
    });
  }
};

/**
 * Obtiene todos los conjuntos (solo super_admin y admin)
 */
export const getAllConjuntos = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Super admin ve todos, admin ve solo su conjunto
    if (currentUser.rol === "super_admin") {
      const conjuntos = await conjuntosService.getAllConjuntos();
      return res.status(200).json({
        success: true,
        data: conjuntos,
      });
    } else if (currentUser.rol === "admin" && currentUser.conjunto_id) {
      const conjunto = await conjuntosService.getConjuntoById(currentUser.conjunto_id);
      return res.status(200).json({
        success: true,
        data: conjunto ? [conjunto] : [],
      });
    } else {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para ver conjuntos",
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los conjuntos",
      details: error.message,
    });
  }
};

/**
 * Actualiza un conjunto (solo super_admin)
 */
export const updateConjunto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser || currentUser.rol !== "super_admin") {
      return res.status(403).json({
        success: false,
        error: "Solo los super administradores pueden actualizar conjuntos",
      });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updateData: UpdateConjuntoData = req.body;

    await conjuntosService.updateConjunto(id, updateData);
    const updatedConjunto = await conjuntosService.getConjuntoById(id);

    return res.status(200).json({
      success: true,
      data: updatedConjunto,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al actualizar el conjunto",
      details: error.message,
    });
  }
};

/**
 * Regenera el código de acceso de un conjunto (solo super_admin y admin)
 */
export const regenerateAccessCode = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Verificar permisos
    if (currentUser.rol === "super_admin") {
      // Super admin puede regenerar cualquier código
    } else if (currentUser.rol === "admin" && currentUser.conjunto_id === id) {
      // Admin solo puede regenerar el código de su conjunto
    } else {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para regenerar este código",
      });
    }

    const newCode = await conjuntosService.regenerateAccessCode(id);

    return res.status(200).json({
      success: true,
      data: { codigo_acceso: newCode },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al regenerar el código",
      details: error.message,
    });
  }
};

