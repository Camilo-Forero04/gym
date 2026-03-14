"use client";

import { useState, useEffect } from "react";
// 1. Importamos tu proveedor de sesión (Ajusta los puntos según tu estructura de carpetas)
import { useAuth } from "../components/AuthProvider"; 

export default function StatsCards() {
  // 2. Extraemos al usuario logueado
  const { user, loading: isAuthLoading } = useAuth();
  const USER_ID = user?.id;

  const [stats, setStats] = useState({ month_count: 0, streak: 0, total_volume: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si todavía no hay un ID cargado, no hacemos la petición al backend
    if (!USER_ID) return;

    const fetchStats = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/users/${USER_ID}/stats`);
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch (error) {
        console.error("Error cargando stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [USER_ID]); // 3. Le decimos a React que vuelva a ejecutar esto si el USER_ID cambia

  // Mostramos el "esqueleto" de carga mientras Next.js lee la sesión o hace el fetch
  if (isAuthLoading || isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-pulse h-32 bg-zinc-900 rounded-xl border border-zinc-800"></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Tarjeta 1: Mes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <span className="text-xs font-bold text-zinc-500 uppercase">Entrenamientos / Mes</span>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-black text-zinc-100">{stats.month_count}</span>
          <span className="text-emerald-500 text-xs mb-1 font-bold">↑ Activo</span>
        </div>
      </div>

      {/* Tarjeta 2: Racha */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <span className="text-xs font-bold text-zinc-500 uppercase">Racha Actual</span>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-black text-zinc-100">{stats.streak} días</span>
          <span className="text-orange-500 text-xs mb-1 font-bold">🔥 On fire</span>
        </div>
      </div>

      {/* Tarjeta 3: Volumen */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <span className="text-xs font-bold text-zinc-500 uppercase">Volumen Total</span>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-black text-zinc-100">{stats.total_volume.toLocaleString()}</span>
          <span className="text-zinc-500 text-xs mb-1 font-bold">kg levantados</span>
        </div>
      </div>
    </div>
  );
}