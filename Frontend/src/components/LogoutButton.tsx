"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    setLoading(true);
    // 1. Le decimos al Guardia de Seguridad (Supabase) que destruya la sesión
    await supabase.auth.signOut();
    
    // 2. Refrescamos el router para limpiar la memoria caché de Next.js
    router.refresh();
    
    // 3. Lo mandamos de vuelta a la calle (la pantalla de login)
    router.push("/login");
  };

return (
    <button
      onClick={handleLogout}
      disabled={loading}
      // Estilo minimalista: solo texto que se pinta de rojo al pasar el mouse
      className="text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors uppercase tracking-wider flex items-center justify-center gap-2 py-2 w-full md:w-auto disabled:opacity-50"
    >
      {loading ? "Saliendo..." : "Cerrar Sesión ✕"}
    </button>
  );
}