"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Sub-componente del buscador (el mismo que ya conoces y amas)
function SearchableExerciseSelect({ exercises, value, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredExercises = exercises.filter((ex: any) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (value) {
      const selectedEx = exercises.find((ex: any) => ex.id === value);
      if (selectedEx) setSearchTerm(selectedEx.name);
    } else {
      setSearchTerm("");
    }
  }, [value, exercises]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (value) {
           const selectedEx = exercises.find((ex: any) => ex.id === value);
           if (selectedEx) setSearchTerm(selectedEx.name);
        } else {
           setSearchTerm("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, exercises]);

  useEffect(() => {
    if (highlightedIndex >= 0 && isOpen) {
      const element = document.getElementById(`edit-exercise-item-${highlightedIndex}`);
      if (element) element.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === "ArrowDown") { setIsOpen(true); return; }
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => prev < filteredExercises.length - 1 ? prev + 1 : prev);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
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

  const groupedExercises = filteredExercises.reduce((acc: any, curr: any) => {
    if (!acc[curr.muscleGroup]) acc[curr.muscleGroup] = [];
    acc[curr.muscleGroup].push(curr);
    return acc;
  }, {});

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 outline-none focus:border-emerald-500 placeholder-zinc-500 font-medium"
        placeholder="Buscar ejercicio..."
        value={searchTerm}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
          if (e.target.value === "") onChange("");
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
          {Object.keys(groupedExercises).length > 0 ? (
            Object.entries(groupedExercises).map(([muscle, exList]: [string, any]) => (
              <div key={muscle}>
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-zinc-700/50 z-10 shadow-sm">
                  {muscle}
                </div>
                {exList.map((ex: any) => {
                  const flatIndex = filteredExercises.findIndex((f: any) => f.id === ex.id);
                  const isHighlighted = highlightedIndex === flatIndex;
                  return (
                    <div
                      key={ex.id}
                      id={`edit-exercise-item-${flatIndex}`}
                      className={`px-4 py-2 cursor-pointer text-sm flex justify-between items-center transition-colors ${isHighlighted ? "bg-emerald-900/80 border-l-4 border-emerald-400 text-white" : "hover:bg-emerald-900/40 text-zinc-300 border-l-4 border-transparent border-b border-zinc-700/30"}`}
                      onClick={() => { onChange(ex.id); setSearchTerm(ex.name); setIsOpen(false); setHighlightedIndex(-1); }}
                      onMouseEnter={() => setHighlightedIndex(flatIndex)}
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

// COMPONENTE PRINCIPAL DE EDICIÓN
export default function EditWorkoutForm({ 
  exercises, 
  initialWorkout 
}: { 
  exercises: any[], 
  initialWorkout: any 
}) {
  const router = useRouter();
  
  // ¡ATENCIÓN! Pega tu USER_ID real aquí por seguridad
  const USER_ID = "e74e0acc-6fc2-41bb-8278-7a0e8063d37b"; 

  // Inicializamos el estado CON LOS DATOS QUE YA EXISTEN
  const [notes, setNotes] = useState(initialWorkout.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Mapeamos las series de la base de datos a nuestro formato del formulario
  const [sets, setSets] = useState<any[]>(
    initialWorkout.sets.length > 0 
      ? initialWorkout.sets.map((s: any) => ({
          exerciseId: s.exerciseId,
          weight: s.weight,
          reps: s.reps,
          isBodyweight: s.isBodyweight,
          unit: "kg" // Al cargar de la DB, siempre viene en Kilos
        }))
      : [{ exerciseId: "", weight: "", reps: "", isBodyweight: false, unit: "kg" }]
  );

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { exerciseId: lastSet ? lastSet.exerciseId : "", weight: "", reps: "", isBodyweight: false, unit: lastSet ? lastSet.unit : "kg" }]);
  };

  const duplicateSet = (index: number) => {
    const newSets = [...sets];
    newSets.splice(index + 1, 0, { ...sets[index] });
    setSets(newSets);
  };

  const updateSet = (index: number, field: string, value: any) => {
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
      // AQUÍ LA MAGIA: Hacemos un PUT a la ruta con el ID de la rutina
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workouts/${initialWorkout.id}`, {
        method: "PUT",
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

      if (!res.ok) throw new Error("Error al actualizar la rutina");

      alert("¡Rutina actualizada con éxito!");
      router.push("/"); 
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 border border-emerald-900/50 shadow-xl shadow-emerald-900/10">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          ✏️ Editando Entrenamiento
        </h2>
        <span className="text-sm text-zinc-500 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
          {new Date(initialWorkout.date).toLocaleDateString()}
        </span>
      </div>

      {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="mb-6">
        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Notas de la sesión</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 h-24 focus:border-emerald-500 outline-none transition-colors"
        />
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg text-emerald-400 font-bold border-b border-zinc-800 pb-2">Series</h3>
        
        {sets.map((set, index) => (
          <div key={index} className="flex flex-wrap gap-2 items-end bg-zinc-950 p-4 rounded-lg border border-zinc-800/80 hover:border-zinc-700 transition-colors">
            
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Ejercicio</label>
              <SearchableExerciseSelect
                exercises={exercises}
                value={set.exerciseId}
                onChange={(val: any) => updateSet(index, "exerciseId", val)}
              />
            </div>

            <div className="w-28 flex flex-col">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Peso</label>
              <div className="flex bg-zinc-900 border border-zinc-700 rounded overflow-hidden focus-within:border-emerald-500 transition-colors">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={set.weight}
                  onChange={(e) => updateSet(index, "weight", e.target.value)}
                  className="w-full bg-transparent p-2 text-zinc-200 outline-none font-mono"
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

            <div className="flex gap-1 pb-1">
              <button type="button" onClick={() => duplicateSet(index)} className="bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white px-3 py-2 rounded transition-colors font-bold">+</button>
              {sets.length > 1 && (
                <button type="button" onClick={() => removeSet(index)} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-2 rounded transition-colors font-bold">X</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8">
        <button type="button" onClick={addSet} className="text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors border border-emerald-900/50 hover:bg-emerald-900/20 px-4 py-2 rounded">
          + Nueva Fila
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-200 font-bold py-3 px-6 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading || sets.some(s => !s.exerciseId)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}