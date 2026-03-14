"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import CoachSuggestion from "./CoachSuggestion";
import { useAuth } from "./AuthProvider";


// --- 1. INTERFACES ---
interface WorkoutSet {
  exerciseId: string;
  weight: number | string;
  reps: number | string;
  isBodyweight: boolean;
  unit: "kg" | "lb"; 
}

// --- 2. EL BUSCADOR INTELIGENTE (AHORA CON SOPORTE PARA TECLADO) ---
function SearchableExerciseSelect({ 
  exercises, 
  value, 
  onChange 
}: { 
  exercises: any[], 
  value: string, 
  onChange: (val: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // NUEVO: Estado para saber en qué elemento estamos posicionados con el teclado
  const [highlightedIndex, setHighlightedIndex] = useState(-1); 
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filtramos la lista
  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sincronizamos el texto si cambia por fuera
  useEffect(() => {
    if (value) {
      const selectedEx = exercises.find(ex => ex.id === value);
      if (selectedEx) setSearchTerm(selectedEx.name);
    } else {
      setSearchTerm("");
    }
  }, [value, exercises]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1); // Reseteamos el teclado
        if (value) {
           const selectedEx = exercises.find(ex => ex.id === value);
           if (selectedEx) setSearchTerm(selectedEx.name);
        } else {
           setSearchTerm("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, exercises]);

  // NUEVO: Auto-Scroll. Si bajamos con el teclado, la lista baja sola
  useEffect(() => {
    if (highlightedIndex >= 0 && isOpen) {
      const element = document.getElementById(`exercise-item-${highlightedIndex}`);
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // NUEVO: La magia que controla las flechas del teclado y el Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === "ArrowDown") {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault(); // Evita que la página completa baje
      setHighlightedIndex(prev => prev < filteredExercises.length - 1 ? prev + 1 : prev);
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); // Evita que la página completa suba
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === "Enter") {
      e.preventDefault(); // ¡VITAL! Evita que el botón verde de "Finalizar Rutina" se dispare
      if (highlightedIndex >= 0 && highlightedIndex < filteredExercises.length) {
        const selectedEx = filteredExercises[highlightedIndex];
        onChange(selectedEx.id);
        setSearchTerm(selectedEx.name);
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const groupedExercises = filteredExercises.reduce((acc, curr) => {
    if (!acc[curr.muscleGroup]) acc[curr.muscleGroup] = [];
    acc[curr.muscleGroup].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 outline-none focus:border-emerald-500 placeholder-zinc-500"
        placeholder="Buscar ejercicio..."
        value={searchTerm}
        onKeyDown={handleKeyDown} // Conectamos el teclado
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0); // Al escribir, marcamos siempre el primer resultado
          if (e.target.value === "") onChange("");
        }}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
          {Object.keys(groupedExercises).length > 0 ? (
            Object.entries(groupedExercises).map(([muscle, exList]) => (
              <div key={muscle}>
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-zinc-700/50 z-10 shadow-sm">
                  {muscle}
                </div>
                
                {(exList as any[]).map((ex: any) => {
                  // Encontramos la posición exacta de este ejercicio para el teclado
                  const flatIndex = filteredExercises.findIndex(f => f.id === ex.id);
                  const isHighlighted = highlightedIndex === flatIndex;

                  return (
                    <div
                      key={ex.id}
                      id={`exercise-item-${flatIndex}`}
                      className={`px-4 py-2 cursor-pointer text-sm flex justify-between items-center transition-colors
                        ${isHighlighted 
                          ? "bg-emerald-900/80 border-l-4 border-emerald-400 text-white" // Estilo cuando pasas con el teclado
                          : "hover:bg-emerald-900/40 text-zinc-300 border-l-4 border-transparent border-b border-zinc-700/30"
                        }
                      `}
                      onClick={() => {
                        onChange(ex.id);
                        setSearchTerm(ex.name);
                        setIsOpen(false);
                        setHighlightedIndex(-1);
                      }}
                      onMouseEnter={() => setHighlightedIndex(flatIndex)} // Si pasas el ratón, el teclado lo sigue
                    >
                      <span className="font-medium">{ex.name}</span>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-zinc-500 text-center italic">No se encontraron resultados</div>
          )}
        </div>
      )}
    </div>
  );
}

// --- 3. EL COMPONENTE PRINCIPAL DEL FORMULARIO ---
export default function WorkoutForm({ exercises }: { exercises: any[] }) {
  const router = useRouter();
  const { user, loading: isAuthLoading} = useAuth(); // Obtenemos la sesión real

  if (isAuthLoading) return <p className="text-zinc-500">Cargando sesión...</p>;
  if (!user) return <p className="text-red-500">Debes iniciar sesión para entrenar.</p>;
  // ¡ATENCIÓN! Pega tu USER_ID real aquí
  const USER_ID = user.id;

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [sets, setSets] = useState<WorkoutSet[]>([
    { exerciseId: "", weight: "", reps: "", isBodyweight: false, unit: "kg" } 
  ]);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets, 
      { 
        exerciseId: lastSet ? lastSet.exerciseId : "", 
        weight: "", 
        reps: "", 
        isBodyweight: false,
        unit: lastSet ? lastSet.unit : "kg"
      }
    ]);
  };

  const duplicateSet = (index: number) => {
    const newSets = [...sets];
    newSets.splice(index + 1, 0, { ...sets[index] });
    setSets(newSets);
  };

  const updateSet = (index: number, field: keyof WorkoutSet, value: any) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          notes: notes,
          sets: sets.map(s => {
            let finalWeight = Number(s.weight) || 0;
            if (s.unit === "lb") finalWeight = finalWeight / 2.20462;
            finalWeight = Math.round(finalWeight * 100) / 100;

            return {
              exerciseId: s.exerciseId,
              weight: finalWeight,
              reps: Number(s.reps) || 0,
              isBodyweight: s.isBodyweight
            };
          }),
        }),
      });

      if (!res.ok) throw new Error("Error al guardar la rutina");

      alert("¡Rutina guardada con éxito!");
      router.push("/"); 
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-zinc-100">Registrar Entrenamiento</h2>

      {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="mb-6">
        <label className="block text-sm text-zinc-400 mb-2 font-medium">Notas de la sesión</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Cómo te sentiste hoy?"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 h-24 focus:border-emerald-500 outline-none transition-colors"
        />
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg text-emerald-400 font-bold border-b border-zinc-800 pb-2">Series</h3>
        
{sets.map((set, index) => (
  <div key={index} className="space-y-3 bg-zinc-950 p-4 rounded-lg border border-zinc-800/80 hover:border-zinc-700 transition-colors">
    
    <div className="flex flex-wrap gap-2 items-end">
      {/* --- Buscador de Ejercicio --- */}
      <div className="flex-1 min-w-[220px]">
        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Ejercicio</label>
        <SearchableExerciseSelect
          exercises={exercises}
          value={set.exerciseId}
          onChange={(val) => updateSet(index, "exerciseId", val)}
        />
      </div>

      {/* --- Peso --- */}
      <div className="w-28 flex flex-col">
        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Peso</label>
        <div className="flex bg-zinc-900 border border-zinc-700 rounded overflow-hidden focus-within:border-emerald-500 transition-colors">
          <input
            type="number"
            required
            min="0"
            step="0.5"
            value={set.weight}
            onChange={(e) => updateSet(index, "weight", e.target.value)}
            className="w-full bg-transparent p-2 text-zinc-200 outline-none font-mono"
            placeholder="0"
          />
          <button
            type="button"
            onClick={() => updateSet(index, "unit", set.unit === "kg" ? "lb" : "kg")}
            className="px-2 text-[10px] font-black text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors border-l border-zinc-700 bg-zinc-950 w-10"
          >
            {set.unit.toUpperCase()}
          </button>
        </div>
      </div>

      {/* --- Repeticiones --- */}
      <div className="w-20">
        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Reps</label>
        <input
          type="number"
          required
          min="1"
          value={set.reps}
          onChange={(e) => updateSet(index, "reps", e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 outline-none focus:border-emerald-500 font-mono"
        />
      </div>

      {/* --- Acciones (Duplicar/Eliminar) --- */}
      <div className="flex gap-1 pb-1">
        <button
          type="button"
          onClick={() => duplicateSet(index)}
          className="bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white px-3 py-2 rounded transition-colors font-bold"
        >
          +
        </button>
        
        {sets.length > 1 && (
          <button
            type="button"
            onClick={() => removeSet(index)}
            className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-2 rounded transition-colors font-bold"
          >
            X
          </button>
        )}
      </div>
    </div>

    {/* --- AQUÍ INSERTAMOS LA MAGIA --- */}
    {/* Solo mostramos la sugerencia si el ejercicio ha sido seleccionado en esta fila */}
    {set.exerciseId && (
      <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
      <CoachSuggestion 
        exerciseId={set.exerciseId} 
        userId={USER_ID} 
        currentWeight={Number(set.weight)} 
        currentReps={Number(set.reps)} 
        unit={set.unit}
      />
      </div>
    )}
  </div>
))}
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={addSet}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors border border-emerald-900/50 hover:bg-emerald-900/20 px-4 py-2 rounded"
        >
          + Nueva Fila
        </button>

        <button
          type="submit"
          disabled={loading || sets.some(s => !s.exerciseId)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20"
        >
          {loading ? "Guardando..." : "Finalizar Entreno"}
        </button>
      </div>
    </form>
  );
}