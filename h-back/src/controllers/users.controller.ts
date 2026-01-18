import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as usersService from "../services/users.service";
import type { CreateUserData, UpdateUserData } from "../types/user";

/**
 * Crea un nuevo usuario
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const userData: CreateUserData = req.body;

    // Validaciones básicas
    if (!userData.auth_id || !userData.email || !userData.nombre) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: auth_id, email, nombre",
      });
    }

    // Verificar si el usuario ya existe
    const exists = await usersService.userExists(userData.auth_id);
    if (exists) {
      return res.status(409).json({
        success: false,
        error: "El usuario ya existe",
      });
    }

    const user = await usersService.createUser(userData);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al crear el usuario",
      details: error.message,
    });
  }
};

/**
 * Obtiene un usuario por ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID de usuario requerido",
      });
    }

    const user = await usersService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener el usuario",
      details: error.message,
    });
  }
};

/**
 * Obtiene el usuario actual (desde el token)
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const user = await usersService.getUserByAuthId(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado en Firestore",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener el usuario",
      details: error.message,
    });
  }
};

/**
 * Actualiza un usuario
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID de usuario requerido",
      });
    }
    const userData: UpdateUserData = req.body;

    // Verificar que el usuario existe
    const existingUser = await usersService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Verificar permisos: solo puede actualizar su propio perfil o ser admin
    if (req.user && req.user.uid !== existingUser.auth_id) {
      // Aquí podrías verificar si es admin
      // Por ahora, solo permitimos actualizar el propio perfil
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para actualizar este usuario",
      });
    }

    await usersService.updateUser(id, userData);
    const updatedUser = await usersService.getUserById(id);

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al actualizar el usuario",
      details: error.message,
    });
  }
};

/**
 * Obtiene usuarios por conjunto
 * Solo super_admin o admin del conjunto pueden ver los usuarios
 */
export const getUsersByConjunto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const conjuntoId = Array.isArray(req.params.conjuntoId)
      ? req.params.conjuntoId[0]
      : req.params.conjuntoId;
    if (!conjuntoId) {
      return res.status(400).json({
        success: false,
        error: "ID de conjunto requerido",
      });
    }

    // Verificar permisos: solo super_admin o admin del conjunto pueden ver usuarios
    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Super admin puede ver usuarios de cualquier conjunto
    if (currentUser.rol === "super_admin") {
      const users = await usersService.getUsersByConjunto(conjuntoId);
      return res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    }

    // Admin solo puede ver usuarios de su propio conjunto
    if (currentUser.rol === "admin" && currentUser.conjunto_id === conjuntoId) {
      const users = await usersService.getUsersByConjunto(conjuntoId);
      return res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    }

    // Si no es super_admin ni admin del conjunto, denegar acceso
    return res.status(403).json({
      success: false,
      error: "No tienes permisos para ver los usuarios de este conjunto",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los usuarios",
      details: error.message,
    });
  }
};

/**
 * Obtiene todos los usuarios (solo super admin)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
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
        error: "Solo los super administradores pueden ver todos los usuarios",
      });
    }

    const users = await usersService.getAllUsers();

    return res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los usuarios",
      details: error.message,
    });
  }
};

/**
 * Asigna rol de admin a un usuario por email (solo super admin)
 */
export const assignAdminRole = async (req: AuthRequest, res: Response) => {
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
        error: "Solo los super administradores pueden asignar roles de admin",
      });
    }

    const { email, conjunto_id } = req.body;

    if (!email || !conjunto_id) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: email, conjunto_id",
      });
    }

    // Buscar usuario por email
    const userToUpdate = await usersService.getUserByEmail(email);

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado con ese email",
      });
    }

    // Guardar estado anterior para el historial
    const estadoAnterior = {
      rol: userToUpdate.rol,
      conjunto_id: userToUpdate.conjunto_id || null,
      unidad: userToUpdate.unidad || null,
    };

    // Si el usuario ya tiene un conjunto diferente, se actualizará al nuevo
    const conjuntoCambiado = estadoAnterior.conjunto_id && estadoAnterior.conjunto_id !== conjunto_id;
    
    // Si el usuario ya era admin de otro conjunto, se le cambiará de conjunto
    const esAdminActual = estadoAnterior.rol === "admin";
    
    // Actualizar usuario con rol admin y conjunto_id
    // Si cambia de conjunto, limpiar la unidad (usar undefined, no null)
    const unidadToSet = conjuntoCambiado 
      ? undefined 
      : (userToUpdate.unidad || undefined);
    
    await usersService.updateUser(userToUpdate.id, {
      rol: "admin",
      conjunto_id: conjunto_id,
      unidad: unidadToSet,
    });

    const updatedUser = await usersService.getUserById(userToUpdate.id);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: "Error al obtener el usuario actualizado",
      });
    }

    // Mensaje detallado sobre los cambios
    let mensaje = "Rol de admin asignado correctamente";
    const cambios: string[] = [];

    if (estadoAnterior.rol !== "admin") {
      cambios.push(`Rol cambiado de "${estadoAnterior.rol}" a "admin"`);
    } else {
      cambios.push(`Rol mantenido como "admin"`);
    }

    if (conjuntoCambiado) {
      cambios.push(`Conjunto cambiado (anterior: ${estadoAnterior.conjunto_id}, nuevo: ${conjunto_id})`);
    } else if (!estadoAnterior.conjunto_id) {
      cambios.push(`Conjunto asignado por primera vez`);
    } else {
      cambios.push(`Conjunto mantenido`);
    }

    if (conjuntoCambiado && estadoAnterior.unidad) {
      cambios.push(`Unidad limpiada debido al cambio de conjunto`);
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: mensaje,
      cambios: cambios,
      estado_anterior: estadoAnterior,
      estado_nuevo: {
        rol: updatedUser.rol,
        conjunto_id: updatedUser.conjunto_id || null,
        unidad: updatedUser.unidad || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al asignar rol de admin",
      details: error.message,
    });
  }
};

/**
 * Elimina un usuario (solo super admin)
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
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
        error: "Solo los super administradores pueden eliminar usuarios",
      });
    }

    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID de usuario requerido",
      });
    }

    // No permitir que un usuario se elimine a sí mismo
    if (userId === currentUser.id) {
      return res.status(400).json({
        success: false,
        error: "No puedes eliminar tu propio usuario",
      });
    }

    // Obtener el usuario antes de eliminarlo
    const userToDelete = await usersService.getUserById(userId);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // No permitir eliminar otros super admins
    if (userToDelete.rol === "super_admin") {
      return res.status(403).json({
        success: false,
        error: "No se pueden eliminar otros super administradores",
      });
    }

    // Eliminar el usuario
    await usersService.deleteUser(userId);

    return res.status(200).json({
      success: true,
      message: "Usuario eliminado correctamente",
      data: {
        id: userId,
        email: userToDelete.email,
        nombre: userToDelete.nombre,
        rol: userToDelete.rol,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al eliminar el usuario",
      details: error.message,
    });
  }
};

