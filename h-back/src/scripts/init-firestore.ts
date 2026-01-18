import { adminDb } from "../config/firebase";

/**
 * Script para inicializar y verificar la conexión a Firestore
 * y crear la colección de usuarios si no existe
 */
const initFirestore = async () => {
  try {
    console.log("🔍 Verificando conexión a Firestore...");

    // Verificar conexión intentando leer una colección
    const testRef = adminDb.collection("_test");
    await testRef.limit(1).get();
    console.log("✅ Conexión a Firestore establecida correctamente");

    // Verificar si la colección de usuarios existe
    console.log("🔍 Verificando colección 'usuarios'...");
    const usersRef = adminDb.collection("usuarios");
    const usersSnapshot = await usersRef.limit(1).get();

    if (usersSnapshot.empty) {
      console.log("📝 La colección 'usuarios' no existe o está vacía");
      console.log("ℹ️  La colección se creará automáticamente cuando se agregue el primer documento");
    } else {
      console.log("✅ La colección 'usuarios' existe");
      const count = (await usersRef.count().get()).data().count;
      console.log(`📊 Total de usuarios en la colección: ${count}`);
    }

    // Crear un documento de ejemplo para inicializar la colección (opcional)
    console.log("\n📋 Estructura esperada de la colección 'usuarios':");
    console.log(JSON.stringify({
      id: "auth_id_del_usuario",
      auth_id: "auth_id_del_usuario",
      email: "usuario@example.com",
      nombre: "Nombre del Usuario",
      conjunto_id: "uuid_del_conjunto | null",
      unidad: "Apto 101 | null",
      rol: "residente | admin | super_admin",
      created_at: "Timestamp",
      updated_at: "Timestamp"
    }, null, 2));

    console.log("\n✅ Inicialización completada");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error al inicializar Firestore:", error.message);
    console.error("Detalles:", error);
    process.exit(1);
  }
};

// Ejecutar el script
initFirestore();

