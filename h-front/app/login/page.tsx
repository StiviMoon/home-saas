"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { usersApiService } from "@/lib/services/users-api.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2 } from "lucide-react";
import { FirebaseError } from "firebase/app";

type AuthMode = "login" | "register";

const LoginPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, signUpWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones básicas
      if (!email || !password) {
        setError("Por favor, completa todos los campos");
        setLoading(false);
        return;
      }

      if (mode === "register") {
        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }
      }

      // Verificar credenciales especiales de admin
      const isSpecialAdmin = email === "steven.rodriguezlop@gmail.com" && password === "admin1234";
      
      // Autenticación
      let currentUser;
      if (mode === "login") {
        currentUser = await loginWithEmail(email, password);
      } else {
        currentUser = await signUpWithEmail(email, password);
      }

      // Si es admin especial, actualizar rol
      if (isSpecialAdmin) {
        try {
          const token = await currentUser.getIdToken();
          await usersApiService.updateUser(
            currentUser.uid,
            { rol: "super_admin" },
            token
          );
        } catch {
          // Error silencioso, el usuario ya está autenticado
        }
      }

      // Verificar si el usuario tiene conjunto asignado o es super admin
      try {
        const token = await currentUser.getIdToken();
        const userData = await usersApiService.getCurrentUser(token);
        
        // Super admins van directo al dashboard sin necesidad de conjunto
        if (userData.rol === "super_admin") {
          toast.success("¡Bienvenido Super Administrador!", {
            description: "Has iniciado sesión correctamente",
          });
          router.push("/dashboard");
          return;
        } else if (!userData.conjunto_id) {
          // Si no tiene conjunto y no es super admin, redirigir a selección de conjunto
          toast.info("Completa tu perfil", {
            description: "Selecciona tu conjunto residencial para continuar",
          });
          router.push("/select-conjunto");
          return;
        } else {
          // Si tiene conjunto, redirigir al dashboard
          toast.success("¡Bienvenido!", {
            description: `Has iniciado sesión como ${userData.rol === "admin" ? "Administrador" : "Residente"}`,
          });
          router.push("/dashboard");
          return;
        }
      } catch (apiError: unknown) {
        // Si hay error al obtener usuario del backend, verificar si es un error de conexión
        const error = apiError as { message?: string; status?: number };
        
        if (error.message && error.message.includes("No se pudo conectar con el servidor backend")) {
          // Error de conexión: mostrar error y NO redirigir (el usuario puede intentar de nuevo)
          toast.error("Error de conexión", {
            description: error.message,
            duration: 10000,
          });
          setError(error.message);
          return;
        }
        
        // Si es un error 404 (usuario no existe), permitir que el flujo normal continúe
        // El hook use-auth debería crear el usuario automáticamente
        if (error.status === 404) {
          // El usuario no existe en el backend pero ya está autenticado en Firebase
          // Redirigir al dashboard y dejar que el sistema maneje la creación
          toast.info("Creando tu perfil...");
          router.push("/dashboard");
          return;
        }
        
        // Otro error: mostrar mensaje y NO redirigir automáticamente
        console.error("Error al obtener usuario del backend:", apiError);
        toast.error("Error al verificar tu cuenta", {
          description: "Por favor, intenta de nuevo en un momento",
          duration: 8000,
        });
        setError("Error al verificar tu cuenta. Por favor, intenta de nuevo.");
      }
    } catch (err) {
      let errorMessage = "Ocurrió un error. Por favor, intenta de nuevo.";

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-email":
            errorMessage = "El email no es válido";
            break;
          case "auth/user-disabled":
            errorMessage = "Esta cuenta ha sido deshabilitada";
            break;
          case "auth/user-not-found":
            errorMessage = "No existe una cuenta con este email";
            break;
          case "auth/wrong-password":
            errorMessage = "La contraseña es incorrecta";
            break;
          case "auth/email-already-in-use":
            errorMessage = "Este email ya está registrado";
            break;
          case "auth/weak-password":
            errorMessage = "La contraseña es muy débil";
            break;
          case "auth/network-request-failed":
            errorMessage = "Error de conexión. Verifica tu internet";
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      const currentUser = await loginWithGoogle();
      
      // Verificar si el usuario tiene conjunto asignado o es super admin
      try {
        const token = await currentUser.getIdToken();
        const userData = await usersApiService.getCurrentUser(token);
        
        // Super admins van directo al dashboard sin necesidad de conjunto
        if (userData.rol === "super_admin") {
          toast.success("¡Bienvenido Super Administrador! Has iniciado sesión correctamente");
          router.push("/dashboard");
          return;
        } else if (userData.rol === "admin" && userData.conjunto_id) {
          // Admins van directo al dashboard (ya tienen conjunto asignado)
          toast.success("¡Bienvenido Administrador! Has iniciado sesión correctamente");
          router.push("/dashboard");
          return;
        } else if (!userData.conjunto_id) {
          // Si no tiene conjunto y no es super admin ni admin, redirigir a selección de conjunto
          toast.info("Completa tu perfil - Selecciona tu conjunto residencial para continuar");
          router.push("/select-conjunto");
          return;
        } else {
          // Si tiene conjunto, redirigir al dashboard
          toast.success("¡Bienvenido! Has iniciado sesión correctamente");
          router.push("/dashboard");
          return;
        }
      } catch (apiError: unknown) {
        // Si hay error al obtener usuario del backend, verificar si es un error de conexión
        const error = apiError as { message?: string; status?: number };
        
        if (error.message && error.message.includes("No se pudo conectar con el servidor backend")) {
          // Error de conexión: mostrar error y NO redirigir (el usuario puede intentar de nuevo)
          toast.error("Error de conexión", {
            description: error.message,
            duration: 10000,
          });
          setError(error.message);
          return;
        }
        
        // Si es un error 404 (usuario no existe), permitir que el flujo normal continúe
        // El hook use-auth debería crear el usuario automáticamente
        if (error.status === 404) {
          // El usuario no existe en el backend pero ya está autenticado en Firebase
          // Para super admins, ir directo al dashboard (el sistema creará el usuario)
          // Para otros, redirigir al dashboard también y dejar que el sistema maneje la creación
          toast.info("Creando tu perfil...");
          router.push("/dashboard");
          return;
        }
        
        // Otro error: mostrar mensaje y NO redirigir automáticamente
        console.error("Error al obtener usuario del backend:", apiError);
        toast.error("Error al verificar tu cuenta", {
          description: "Por favor, intenta de nuevo en un momento",
          duration: 8000,
        });
        setError("Error al verificar tu cuenta. Por favor, intenta de nuevo.");
      }
    } catch (err) {
      let errorMessage = "Error al autenticar con Google. Por favor, intenta de nuevo.";

      if (err instanceof FirebaseError) {
        if (err.code === "auth/popup-closed-by-user") {
          errorMessage = "Cierre la ventana de Google. Intenta de nuevo.";
        } else if (err.code === "auth/popup-blocked") {
          errorMessage = "La ventana emergente fue bloqueada. Permite ventanas emergentes e intenta de nuevo.";
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        // Mostrar mensajes de error de conexión de forma más clara
        if (err.message.includes("No se pudo conectar con el servidor backend")) {
          errorMessage = err.message;
          toast.error("Error de conexión", {
            description: "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.",
            duration: 8000,
          });
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "login"
                ? "Ingresa tus credenciales para acceder"
                : "Crea una cuenta para comenzar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div
                className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Email"
                  tabIndex={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                  aria-label="Contraseña"
                  tabIndex={0}
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    aria-label="Confirmar contraseña"
                    tabIndex={0}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                aria-label={mode === "login" ? "Iniciar sesión" : "Registrarse"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}
                  </>
                ) : mode === "login" ? (
                  "Iniciar Sesión"
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={loading}
              aria-label="Iniciar sesión con Google"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              {mode === "login" ? (
                <>
                  ¿No tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-primary hover:underline font-medium"
                    tabIndex={0}
                    aria-label="Cambiar a modo registro"
                  >
                    Regístrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-primary hover:underline font-medium"
                    tabIndex={0}
                    aria-label="Cambiar a modo login"
                  >
                    Inicia Sesión
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default LoginPage;

