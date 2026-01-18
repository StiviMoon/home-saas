import { adminDb } from "../config/firebase";
import type { Conjunto, CreateConjuntoData, UpdateConjuntoData } from "../types/conjunto";
import { v4 as uuidv4 } from "uuid";

const CONJUNTOS_COLLECTION = "conjuntos";

/**
 * Genera un código de acceso aleatorio de 10 caracteres
 */
const generateAccessCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Convierte un documento de Firestore a Conjunto
 */
const firestoreToConjunto = (doc: FirebaseFirestore.DocumentSnapshot): Conjunto => {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined");

  // Convertir Timestamp de Firestore a Date si es necesario
  let created_at: Date;
  if (data.created_at && typeof data.created_at.toDate === "function") {
    created_at = data.created_at.toDate();
  } else if (data.created_at instanceof Date) {
    created_at = data.created_at;
  } else {
    created_at = new Date();
  }

  return {
    id: doc.id,
    nombre: data.nombre,
    direccion: data.direccion,
    ciudad: data.ciudad,
    codigo_acceso: data.codigo_acceso,
    created_at,
  } as Conjunto;
};

/**
 * Crea un nuevo conjunto
 */
export const createConjunto = async (conjuntoData: CreateConjuntoData): Promise<Conjunto> => {
  const id = uuidv4();
  const conjuntoRef = adminDb.collection(CONJUNTOS_COLLECTION).doc(id);

  const codigo_acceso = conjuntoData.codigo_acceso || generateAccessCode();

  const newConjunto = {
    nombre: conjuntoData.nombre,
    direccion: conjuntoData.direccion,
    ciudad: conjuntoData.ciudad,
    codigo_acceso,
    created_at: new Date(),
  };

  await conjuntoRef.set(newConjunto);

  return {
    id,
    ...newConjunto,
  };
};

/**
 * Obtiene un conjunto por ID
 */
export const getConjuntoById = async (conjuntoId: string): Promise<Conjunto | null> => {
  const doc = await adminDb.collection(CONJUNTOS_COLLECTION).doc(conjuntoId).get();
  if (!doc.exists) return null;
  return firestoreToConjunto(doc);
};

/**
 * Obtiene un conjunto por código de acceso
 */
export const getConjuntoByCode = async (codigo: string): Promise<Conjunto | null> => {
  const snapshot = await adminDb
    .collection(CONJUNTOS_COLLECTION)
    .where("codigo_acceso", "==", codigo)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return firestoreToConjunto(snapshot.docs[0]);
};

/**
 * Obtiene todos los conjuntos
 */
export const getAllConjuntos = async (): Promise<Conjunto[]> => {
  const snapshot = await adminDb.collection(CONJUNTOS_COLLECTION).get();
  return snapshot.docs.map((doc) => firestoreToConjunto(doc));
};

/**
 * Actualiza un conjunto
 */
export const updateConjunto = async (
  conjuntoId: string,
  updateData: UpdateConjuntoData
): Promise<void> => {
  const conjuntoRef = adminDb.collection(CONJUNTOS_COLLECTION).doc(conjuntoId);
  await conjuntoRef.update({
    ...updateData,
    updated_at: new Date(),
  });
};

/**
 * Regenera el código de acceso de un conjunto
 */
export const regenerateAccessCode = async (conjuntoId: string): Promise<string> => {
  const newCode = generateAccessCode();
  await updateConjunto(conjuntoId, { codigo_acceso: newCode });
  return newCode;
};

