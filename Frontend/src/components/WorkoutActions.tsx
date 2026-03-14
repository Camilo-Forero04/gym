"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WorkoutActions({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // 1. Pedimos confirmación antes de hacer cualquier desastre
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.");
    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      
      // 2. Enviamos la petición DELETE al backend
      const res = await fetch(`${baseUrl}/workouts/${workoutId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor: ${errorText}`);
      }

      // 3. Si todo salió bien, recargamos la página (sin que parpadee) para que la rutina desaparezca
      router.refresh();
      
    } catch (error) {
      console.error("Error al eliminar la rutina:", error);
      alert("No se pudo eliminar la rutina. Revisa la consola.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Botón de Editar */}
      <Link
        href={`/workouts/${workoutId}/edit`}
        className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center justify-center"
        title="Editar rutina"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
      </Link>

      {/* Botón de Eliminar */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
          isDeleting 
            ? "text-zinc-600 cursor-not-allowed" 
            : "text-zinc-400 hover:text-red-400 hover:bg-red-900/20"
        }`}
        title="Eliminar rutina"
      >
        {isDeleting ? (
          <span className="text-xs font-bold animate-pulse">⏳</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        )}
      </button>
    </div>
  );
}