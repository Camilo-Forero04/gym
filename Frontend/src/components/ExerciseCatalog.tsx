"use client";

import { useState, useEffect, useMemo } from "react";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string; 
}

export default function ExerciseCatalog() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Mantenemos el ID que ya estabas usando
  const USER_ID = "71c00ba1-c064-4439-976a-c6955b376082";

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/exercises`);
        if (res.ok) {
          const json = await res.json();
          const sorted = (json.data as Exercise[]).sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setExercises(sorted);
        }
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exercises, searchTerm]);

  if (isLoading) {
    return <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 animate-pulse h-[300px]"></div>;
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-lg space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-zinc-100">Catálogo de Ejercicios</h2>
        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
          {exercises.length}
        </span>
      </div>

      {/* Buscador compacto */}
      <div className="relative group">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="search"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-700/60 rounded-lg py-2 pl-10 pr-3 text-zinc-200 outline-none transition-all placeholder:text-zinc-700 text-sm shadow-inner"
        />
      </div>

      {/* Área de scroll restringida: 
          Cambiamos h-96 por h-[195px] para limitar la vista a 3 ejercicios.
      */}
      <div className="h-[195px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
        {filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <div 
              key={ex.id} 
              className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-lg border border-zinc-700/50 hover:bg-zinc-800/80 hover:border-emerald-700/30 transition-all group"
            >
              <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors capitalize">
                {ex.name}
              </span>

              <span className="bg-emerald-950/40 text-emerald-400 text-[9px] font-bold rounded-full px-2.5 py-1 uppercase tracking-wider border border-emerald-900/30">
                {ex.muscleGroup}
              </span>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg text-center p-6 space-y-2">
            <span className="text-3xl">🤔</span>
            <p className="text-sm text-zinc-600">No hay resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}