import React from 'react';
// Asegúrate de que esta ruta de importación sea la que te funcionó antes
import EditWorkoutForm from '../../../../components/EditWorkoutForm'; 
import Link from 'next/link';

async function getExercises() {
  // Aseguramos que la URL base no termine en slash para evitar errores
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/api/v1/exercises`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

async function getWorkout(id: string) {
  // Aquí corregimos el problema del slash faltante ("v1workouts")
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const url = `${baseUrl}/workouts/${id}`;
  
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    const errorBody = await res.text(); 
    console.error("Backend error response:", errorBody); 
    throw new Error(`Error en el servidor (${res.status}): ${errorBody}`);
  }
  
  const json = await res.json();
  return json.data;
}

// AQUÍ ESTÁ LA MAGIA: Desempaquetamos los "params" correctamente para Next.js 15
export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const exercises = await getExercises();
  const workout = await getWorkout(id);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/" className="text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2 text-sm font-bold">
          ← Volver al Panel
        </Link>
        
        <EditWorkoutForm exercises={exercises} initialWorkout={workout} />
      </div>
    </main>
  );
}