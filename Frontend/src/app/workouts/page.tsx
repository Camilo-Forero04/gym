import React from 'react';
import WorkoutForm from '../../components/WorkoutForm';

// Fetch para traer los ejercicios al servidor antes de pintar la pantalla
async function getExercises() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exercises`, {
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data; 
}

export default async function NewWorkoutPage() {
  const exercises = await getExercises();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Botón para regresar al inicio */}
        <a href="/" className="text-zinc-400 hover:text-emerald-400 mb-6 inline-block transition-colors">
          ← Volver al inicio
        </a>
        
        <h1 className="text-4xl font-bold mb-8 text-emerald-400">Bitácora</h1>
        
        {/* Aquí incrustamos el formulario gigante y le pasamos los ejercicios */}
        <WorkoutForm exercises={exercises} />
      </div>
    </main>
  );
}