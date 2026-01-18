"use client";

import { useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { usersApiService } from "@/lib/services/users-api.service";

export const useAuth = () => {
  const { user, setUser, loading, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth no está inicializado");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Obtener token para el backend
      const token = await user.getIdToken();

      // Verificar credenciales especiales de admin
      const isSpecialAdmin = email === "steven.rodriguezlop@gmail.com" && password === "admin1234";

      // Verificar/crear usuario en Firestore a través del backend
      try {
        // Intentar obtener el usuario del backend
        const currentUser = await usersApiService.getCurrentUser(token);
        
        // Si es admin especial, actualizar rol
        if (isSpecialAdmin && currentUser.rol !== "super_admin") {
          await usersApiService.updateUser(
            user.uid,
            { rol: "super_admin" },
            token
          );
        }
      } catch (apiError: unknown) {
        // Si el usuario no existe en Firestore, crearlo
        const error = apiError as { status?: number; message?: string };
        if (error.status === 404) {
          try {
            await usersApiService.createUser(
              {
                auth_id: user.uid,
                email: user.email || email,
                nombre: user.displayName || email.split("@")[0],
                rol: isSpecialAdmin ? "super_admin" : "residente",
              },
              token
            );
          } catch (createError) {
            console.error("Error al crear usuario en backend:", createError);
            // No lanzamos error, el usuario ya está autenticado en Firebase Auth
          }
        } else {
          console.error("Error al obtener usuario del backend:", error);
        }
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth no está inicializado");

    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Obtener token para el backend
      const token = await user.getIdToken();

      // 3. Crear usuario en Firestore a través del backend
      try {
        await usersApiService.createUser(
          {
            auth_id: user.uid,
            email: user.email || email,
            nombre: user.displayName || email.split("@")[0],
            rol: "residente",
          },
          token
        );
      } catch (apiError: unknown) {
        // Si el usuario ya existe (409), no es un error crítico
        const error = apiError as { status?: number; message?: string };
        if (error.status === 409) {
          console.log("Usuario ya existe en Firestore");
        } else {
          console.error("Error al crear usuario en backend:", error);
          // No lanzamos error, el usuario ya está autenticado en Firebase Auth
          // El usuario puede completar su perfil después
        }
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth no está inicializado");

    try {
      // 1. Autenticar con Google
      const provider = new GoogleAuthProvider();
      // Forzar que siempre muestre el selector de cuenta
      provider.setCustomParameters({
        prompt: "select_account",
      });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // 2. Obtener token para el backend
      const token = await user.getIdToken();

      // 3. Verificar/crear usuario en Firestore a través del backend
      try {
        // Intentar obtener el usuario del backend
        await usersApiService.getCurrentUser(token);
      } catch (apiError: unknown) {
        // Manejar errores de red (backend no disponible)
        const error = apiError as { message?: string; status?: number };
        if (error.message && error.message.includes("No se pudo conectar con el servidor backend")) {
          throw new Error(
            `❌ Error de conexión: No se pudo conectar con el servidor backend.\n\n` +
            `💡 Verifica que el backend esté corriendo:\n` +
            `   cd back-h && npm run dev`
          );
        }
        
        // Si el usuario no existe en Firestore (404), crearlo
        if (error.status === 404) {
          try {
            await usersApiService.createUser(
              {
                auth_id: user.uid,
                email: user.email || "",
                nombre: user.displayName || user.email?.split("@")[0] || "Usuario",
                rol: "residente",
              },
              token
            );
          } catch (createError: unknown) {
            // Si el usuario ya existe (409), no es un error
            const createErr = createError as { status?: number; message?: string };
            if (createErr.status === 409) {
              console.log("Usuario ya existe en Firestore");
            } else {
              console.error("Error al crear usuario en backend:", createError);
            }
          }
        } else {
          console.error("Error al obtener usuario del backend:", error);
        }
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase Auth no está inicializado");

    try {
      await signOut(auth);
      // La notificación se mostrará en el componente que llama a logout
      router.push("/login");
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    logout,
  };
};

