import { adminDb } from "../config/firebase";
import { adminAuth } from "../config/firebase";
import * as usersService from "../services/users.service";

const SUPER_ADMIN_EMAIL = "steven.rodriguezlop@gmail.com";

/**
 * Script para verificar y crear el super admin si no existe
 */
const checkSuperAdmin = async () => {
  try {
    console.log("🔍 Verificando super admin...");
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);

    // 1. Verificar si existe en Firestore
    const existingUser = await usersService.getUserByEmail(SUPER_ADMIN_EMAIL);

    if (existingUser) {
      console.log("✅ Super admin encontrado en Firestore:");
      console.log(`   - ID: ${existingUser.id}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Nombre: ${existingUser.nombre}`);
      console.log(`   - Rol: ${existingUser.rol}`);
      console.log(`   - Conjunto: ${existingUser.conjunto_id || "Ninguno"}`);

      // Verificar si el rol es correcto
      if (existingUser.rol !== "super_admin") {
        console.log("⚠️  El usuario existe pero no tiene rol de super_admin");
        console.log("💡 Actualizando rol a super_admin...");
        await usersService.updateUser(existingUser.id, { rol: "super_admin" });
        console.log("✅ Rol actualizado correctamente");
      } else {
        console.log("✅ El usuario ya tiene rol de super_admin");
      }
    } else {
      console.log("❌ Super admin NO encontrado en Firestore");
      console.log("💡 Necesitas:");
      console.log("   1. Crear la cuenta en Firebase Auth primero");
      console.log("   2. Luego iniciar sesión con las credenciales especiales");
      console.log("   3. El sistema creará automáticamente el usuario con rol super_admin");
      console.log("");
      console.log("📝 Credenciales especiales:");
      console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`   Password: admin1234`);
    }

    // 2. Verificar si existe en Firebase Auth
    try {
      const firebaseUser = await adminAuth.getUserByEmail(SUPER_ADMIN_EMAIL);
      console.log("\n✅ Usuario encontrado en Firebase Auth:");
      console.log(`   - UID: ${firebaseUser.uid}`);
      console.log(`   - Email: ${firebaseUser.email}`);
      console.log(`   - Email verificado: ${firebaseUser.emailVerified}`);

      // Si existe en Firebase Auth pero no en Firestore, crearlo
      if (!existingUser) {
        console.log("\n💡 Creando usuario en Firestore...");
        const newUser = await usersService.createUser({
          auth_id: firebaseUser.uid,
          email: firebaseUser.email || SUPER_ADMIN_EMAIL,
          nombre: firebaseUser.displayName || "Super Administrador",
          rol: "super_admin",
        });
        console.log("✅ Usuario creado en Firestore:");
        console.log(`   - ID: ${newUser.id}`);
        console.log(`   - Rol: ${newUser.rol}`);
      }
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        console.log("\n❌ Usuario NO encontrado en Firebase Auth");
        console.log("💡 Necesitas crear la cuenta primero:");
        console.log("   1. Ve al frontend y regístrate con:");
        console.log(`      Email: ${SUPER_ADMIN_EMAIL}`);
        console.log(`      Password: admin1234`);
        console.log("   2. El sistema detectará las credenciales especiales");
        console.log("   3. Y asignará automáticamente el rol de super_admin");
      } else {
        console.error("❌ Error al verificar Firebase Auth:", error.message);
      }
    }

    console.log("\n✅ Verificación completada");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error al verificar super admin:", error.message);
    console.error("Detalles:", error);
    process.exit(1);
  }
};

// Ejecutar el script
checkSuperAdmin();

