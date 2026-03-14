"use client";

import { useState } from "react";
import WorkoutActions from "./WorkoutActions";

export default function WorkoutCard({ workout }: { workout: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const PREVIEW_LIMIT = 3; 
  
  const hasMore = workout.sets.length > PREVIEW_LIMIT;
  const visibleSets = isExpanded ? workout.sets : workout.sets.slice(0, PREVIEW_LIMIT);
  const remainingCount = workout.sets.length - PREVIEW_LIMIT;

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg group">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
        <h3 className="text-lg font-bold text-emerald-400 capitalize">
          {new Date(workout.date).toLocaleDateString('es-ES', { 
            weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' 
          }).replace('.', '')}
        </h3>
        
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <WorkoutActions workoutId={workout.id} />
        </div>
      </div>
      
      {workout.notes && (
        <p className="text-sm text-zinc-300 mb-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 italic">
          "{workout.notes}"
        </p>
      )}

 {/* 1. CONTENEDOR DE SERIES (Le añadimos un margen inferior 'mb-6' de 24px) */}
      <div className="space-y-2 transition-all duration-300 mb-4">
        {visibleSets.map((set: any) => (
          <div key={set.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 hover:border-zinc-700 transition-colors">
            <span className="font-medium text-zinc-200">{set.exercise.name}</span>
            <span className="text-zinc-400 font-mono text-sm flex items-center gap-2">
              <span><span className="text-white font-semibold">{set.weight}</span> kg</span>
              <span className="text-zinc-600">x</span> 
              <span><span className="text-white font-semibold">{set.reps}</span> reps</span>
              {set.isBodyweight && <span className="text-[10px] text-emerald-500 bg-emerald-900/30 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Corp</span>}
            </span>
          </div>
        ))}
      </div>

      {/* 2. EL BOTÓN (Completamente limpio y separado) */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 py-2 bg-zinc-950/50 hover:bg-emerald-900/20 border border-dashed border-zinc-700 hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-400 text-sm font-bold rounded-lg transition-all flex items-center justify-center shadow-sm"
        >
          {isExpanded ? "Ocultar lista ▲" : `Ver ${remainingCount} series más ▼`}
        </button>
      )}
    </div>
  );
}