"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUser } from "@/lib/hooks/use-user";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { user: userData, isLoading: userLoading, hasConjunto, isSuperAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && user) {
      // Esperar a que los datos del usuario se carguen antes de redirigir
      if (userData) {
        // Super admins van directo al dashboard sin necesidad de conjunto
        if (isSuperAdmin || hasConjunto) {
          router.push("/dashboard");
        } else {
          router.push("/select-conjunto");
        }
      }
      // Si userData es null pero hay usuario, esperar a que se cargue (no redirigir todavía)
    } else if (!user && !userLoading) {
      router.push("/login");
    }
  }, [user, userLoading, userData, hasConjunto, isSuperAdmin, router]);

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    </AuthGuard>
  );
}
