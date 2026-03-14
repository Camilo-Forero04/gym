"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WorkoutData {
  id: string;
  date: string;
  sets: {
    weight: number;
    exercise: { name: string };
  }[];
}

// Ahora recibe los entrenamientos como Props desde page.tsx
export default function ProgressChart({ workouts = [] }: { workouts: WorkoutData[] }) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  // Extraer todos los nombres de ejercicios únicos que has hecho
  const availableExercises = useMemo(() => {
    const exercises = new Set<string>();
    workouts.forEach(w => w.sets?.forEach(s => exercises.add(s.exercise.name)));
    const list = Array.from(exercises).sort();
    
    // Seleccionar el primero por defecto si la lista se actualiza y no hay selección
    if (list.length > 0 && (!selectedExercise || !list.includes(selectedExercise))) {
      setSelectedExercise(list[0]); 
    }
    return list;
  }, [workouts, selectedExercise]);

  // Procesar los datos para la gráfica basándose en el ejercicio seleccionado
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const data: { date: string; weight: number }[] = [];

    // Copiamos y revertimos el arreglo para que la gráfica vaya de antiguo a nuevo
    const chronologicalWorkouts = [...workouts].reverse();

    chronologicalWorkouts.forEach(workout => {
      // Filtrar las series del ejercicio seleccionado en este día
      const setsForExercise = workout.sets?.filter(s => s.exercise.name === selectedExercise) || [];
      
      if (setsForExercise.length > 0) {
        // Encontrar el peso máximo levantado ese día
        const maxWeight = Math.max(...setsForExercise.map(s => s.weight));
        
        data.push({
          date: new Date(workout.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', ''),
          weight: maxWeight
        });
      }
    });

    return data;
  }, [workouts, selectedExercise]);

  if (availableExercises.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg mb-8 flex items-center justify-center h-48">
        <p className="text-zinc-500 text-sm">Registra entrenamientos para ver tu progreso.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-zinc-200">Progreso de Fuerza</h2>
        
        <select 
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none"
        >
          {availableExercises.map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      <div className="h-64 w-full">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                formatter={(value: any) => [`${value} kg`, 'Peso Máximo']}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#09090b', stroke: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#09090b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-lg">
            <p className="text-zinc-500 text-sm">Registra este ejercicio en más de un día para ver la tendencia.</p>
          </div>
        )}
      </div>
    </div>
  );
}