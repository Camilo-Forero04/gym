"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExerciseForm() {
  const router = useRouter(); // Para recargar la página cuando terminemos
  
  // Estados para guardar lo que el usuario escribe
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [isCompound, setIsCompound] = useState(false);
  const [isUnilateral, setIsUnilateral] = useState(false);
  
  // Estados para manejar la carga y los errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue al dar enter
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          muscleGroup,
          isCompound,
          isUnilateral,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al crear el ejercicio");
      }

      // Si todo sale bien, limpiamos el formulario
      setName("");
      setMuscleGroup("");
      setIsCompound(false);
      setIsUnilateral(false);

      // ¡Mágia de Next.js! Le decimos a la página que vuelva a pedir los datos al servidor
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-zinc-200">Agregar Nuevo Ejercicio</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre del Ejercicio</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sentadilla Libre"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Grupo Muscular</label>
          <input
            type="text"
            required
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            placeholder="Ej: Pierna"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isCompound}
            onChange={(e) => setIsCompound(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
          />
          Es Compuesto
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isUnilateral}
            onChange={(e) => setIsUnilateral(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
          />
          Es Unilateral
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar Ejercicio"}
      </button>
    </form>
  );
}