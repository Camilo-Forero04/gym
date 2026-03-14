"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// 1. Importas tu proveedor de sesión (ajusta los ../ según tu estructura)
import { useAuth } from "../components/AuthProvider"; 

interface BodyMeasurement {
  id: string;
  date: string;
  weight: number;
}

export default function BodyWeightWidget({ measurements }: { measurements: BodyMeasurement[] }) {
  const router = useRouter();
  
  // 2. Extraes al usuario y le pones un alias al loading
  const { user, loading: isAuthLoading } = useAuth(); 
  
  // 3. ¡Adiós hardcodeo! El ID ahora es 100% dinámico
  const USER_ID = user?.id; 

  console.log(user?.id);

  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Medida de seguridad: Si por alguna razón no hay usuario, no hacemos el fetch
    if (!USER_ID) {
      setError("Debes iniciar sesión para guardar tu peso.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          weight: parseFloat(weight),
        }),
      });

      if (!res.ok) throw new Error("Error al guardar el peso");

      setWeight("");
      router.refresh(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Si la sesión apenas está cargando, mostramos un pequeño esqueleto
  if (isAuthLoading) {
    return <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 animate-pulse h-64"></div>;
  }

  // ... (El resto de tu return queda exactamente igual) ...
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-zinc-100">Peso Corporal</h2>
      
      {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.1"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ej: 81.0"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 outline-none focus:border-emerald-500 font-mono pr-10"
          />
          <span className="absolute right-3 top-3 text-zinc-500 font-bold text-sm">KG</span>
        </div>
        <button
          type="submit"
          disabled={loading || !weight}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 rounded-lg disabled:opacity-50 transition-colors"
        >
          +
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Últimos registros</h3>
        
        {measurements.length === 0 ? (
          <p className="text-sm text-zinc-500 italic text-center py-2">Sin registros aún.</p>
        ) : (
          measurements.slice(0, 5).map((m) => (
            <div key={m.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="text-zinc-400 text-sm">
                {new Date(m.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-emerald-400 font-mono font-bold">{m.weight} kg</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}