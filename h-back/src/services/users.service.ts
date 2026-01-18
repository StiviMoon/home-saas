import { adminDb } from "../config/firebase";
import { FieldValue } from "firebase-admin/firestore";
import type { User, CreateUserData, UpdateUserData } from "../types/user";

const USERS_COLLECTION = "usuarios";

/**
 * Convierte un documento de Firestore a User
 */
const firestoreToUser = (doc: FirebaseFirestore.DocumentSnapshot): User => {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined");

  return {
    id: doc.id,
    auth_id: data.auth_id,
    email: data.email,
    nombre: data.nombre,
    conjunto_id: data.conjunto_id || null,
    unidad: data.unidad || null,
    rol: data.rol || "residente",
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  } as User;
};

/**
 * Crea un nuevo usuario en Firestore
 */
export const createUser = async (userData: CreateUserData): Promise<User> => {
  const userRef = adminDb.collection(USERS_COLLECTION).doc(userData.auth_id);

  const newUser = {
    auth_id: userData.auth_id,
    email: userData.email,
    nombre: userData.nombre,
    conjunto_id: userData.conjunto_id || null,
    unidad: userData.unidad || null,
    rol: userData.rol || "residente",
    created_at: new Date(),
    updated_at: new Date(),
  };

  await userRef.set(newUser);

  return {
    id: userData.auth_id,
    ...newUser,
  };
};

/**
 * Obtiene un usuario por su ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return null;
  }

  return firestoreToUser(userSnap);
};

/**
 * Obtiene un usuario por su auth_id
 */
export const getUserByAuthId = async (authId: string): Promise<User | null> => {
  const usersRef = adminDb.collection(USERS_COLLECTION);
  const querySnapshot = await usersRef.where("auth_id", "==", authId).get();

  if (querySnapshot.empty) {
    return null;
  }

  return firestoreToUser(querySnapshot.docs[0]);
};

/**
 * Obtiene un usuario por su email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = adminDb.collection(USERS_COLLECTION);
  const querySnapshot = await usersRef.where("email", "==", email).get();

  if (querySnapshot.empty) {
    return null;
  }

  return firestoreToUser(querySnapshot.docs[0]);
};

/**
 * Actualiza un usuario existente
 */
export const updateUser = async (
  userId: string,
  userData: UpdateUserData
): Promise<void> => {
  const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
  
  // Preparar los datos a actualizar, excluyendo undefined
  const updateData: any = {
    updated_at: FieldValue.serverTimestamp(),
  };
  
  // Solo agregar campos que no sean undefined
  if (userData.conjunto_id !== undefined) {
    updateData.conjunto_id = userData.conjunto_id;
  }
  if (userData.unidad !== undefined) {
    updateData.unidad = userData.unidad;
  }
  if (userData.rol !== undefined) {
    updateData.rol = userData.rol;
  }
  if (userData.nombre !== undefined) {
    updateData.nombre = userData.nombre;
  }
  
  await userRef.update(updateData);
};

/**
 * Obtiene todos los usuarios de un conjunto
 */
export const getUsersByConjunto = async (
  conjuntoId: string
): Promise<User[]> => {
  const usersRef = adminDb.collection(USERS_COLLECTION);
  const querySnapshot = await usersRef
    .where("conjunto_id", "==", conjuntoId)
    .get();

  return querySnapshot.docs.map((doc) => firestoreToUser(doc));
};

/**
 * Verifica si un usuario existe
 */
export const userExists = async (authId: string): Promise<boolean> => {
  const user = await getUserByAuthId(authId);
  return user !== null;
};

/**
 * Obtiene todos los usuarios (solo para super admin)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = adminDb.collection(USERS_COLLECTION);
  const snapshot = await usersRef.get();
  return snapshot.docs.map((doc) => firestoreToUser(doc));
};

/**
 * Elimina un usuario por ID
 */
export const deleteUser = async (userId: string): Promise<void> => {
  const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error("Usuario no encontrado");
  }
  
  await userRef.delete();
};

