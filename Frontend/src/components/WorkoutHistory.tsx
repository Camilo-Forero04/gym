import React from 'react';
import WorkoutCard from './WorkoutCard';

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  isBodyweight: boolean;
  exercise: { name: string; };
}

interface Workout {
  id: string;
  date: string;
  notes: string | null;
  sets: WorkoutSet[];
}

// Ahora el componente RECIBE los entrenamientos desde afuera
export default function WorkoutHistory({ workouts = [] }: { workouts: Workout[] }) {
  
  if (!workouts || workouts.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-400">Aún no has registrado ninguna rutina.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-200 mb-4">Últimos Entrenamientos</h2>
      
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}