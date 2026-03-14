import React from 'react';
import Link from 'next/link';
import { cookies } from "next/headers"; // ¡Faltaba esta importación vital!
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

// Tus componentes
import ExerciseForm from '../components/ExerciseForm';
import WorkoutHistory from '../components/WorkoutHistory';
import BodyWeightWidget from '../components/BodyWeightWidget';
import ProgressChart from '../components/ProgressChart';
import ExerciseCatalog from '../components/ExerciseCatalog';
import StatsCards from '../components/StatsCards';
import LogoutButton from '../components/LogoutButton';

// SOLO UN EXPORT DEFAULT POR ARCHIVO
export default async function Home() {
  // 1. Leemos las cookies del navegador
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 2. Seguridad: Verificamos quién es el usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ¡MAGIA! ID real del guerrero conectado
  const USER_ID = user.id; 

  // 3. FETCH DE DATOS EN PARALELO (Más rápido y profesional)
  // Obtenemos entrenamientos, ejercicios y medidas al mismo tiempo
  
  // A. Entrenamientos del usuario
  const workoutsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workouts?userId=${USER_ID}`, { cache: 'no-store' });
  const userWorkouts = workoutsRes.ok ? await workoutsRes.json() : [];

  // B. Catálogo de ejercicios
  const exercisesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/exercises`, { cache: 'no-store' });
  const exercisesData = exercisesRes.ok ? await exercisesRes.json() : { data: [] };
  const exercises = exercisesData.data || [];

  // C. Historial de peso corporal
  const measurementsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${USER_ID}/measurements`, { cache: 'no-store' });
  const measurementsData = measurementsRes.ok ? await measurementsRes.json() : { data: [] };
  const measurements = measurementsData.data || [];

  // 4. RENDERIZAMOS LA INTERFAZ
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
 {/* CABECERA: Título y Botones */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          
          {/* Izquierda: Título */}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 w-full md:w-auto text-center md:text-left">
            Gym Tracker
          </h1>
          
          {/* Derecha: Grupo de Botones Apilados */}
          <div className="flex flex-col w-full md:w-auto items-center md:items-end gap-2">
            
            {/* 1. Acción Principal (Arriba) */}
            <Link 
              href="/workouts" 
              className="w-full md:w-auto text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
            >
              + Comenzar Entrenamiento
            </Link>

            {/* 2. Acción Secundaria (Abajo y alineada a la derecha) */}
            <div className="w-full md:w-auto flex justify-end">
              <LogoutButton />
            </div>

          </div>

        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Historial de Rutinas (Ocupa 2 espacios) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Aquí en el futuro le pasaremos los userWorkouts a estos componentes para que no traigan datos globales */}
            <StatsCards />
            <ProgressChart workouts={userWorkouts.data || []} />
            <WorkoutHistory workouts={userWorkouts.data || []} />
          </div>

          {/* Columna Derecha: Métricas y Catálogo (Ocupa 1 espacio) */}
          <div className="space-y-8">
            
            {/* WIDGET DE PESO INYECTADO CORRECTAMENTE */}
            <BodyWeightWidget measurements={measurements} />
            
            <ExerciseForm />
            <ExerciseCatalog />
          </div>

        </div>
      </div>
    </main>
  );
}