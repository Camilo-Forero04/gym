"use client";

import { useState, useEffect } from "react";

// --- LÓGICA DE COACH: ESTRICTA PERO SEGURA ---
const calculateNextGoal = (weight: number, reps: number, historicalMax: number = 0) => {
  let nextWeight: number;
  let nextReps: string;
  let reason: string;
  const SAFETY_CAP = 1.20; 

  // EXCEPCIÓN: Si el peso es tan alto que no llegas al rango (Reps < 8)
  if (reps < 8) {
    const e1RM = weight * (1 + reps / 30);
    // Calculamos el peso ideal para que PUEDAS hacer 8 reps reales
    nextWeight = e1RM / (1 + 8 / 30);
    nextReps = "8";
    reason = "Peso excesivo para el rango de hipertrofia. Bajamos carga para dominar las 8 reps con técnica perfecta.";
    return { nextWeight: Math.round(nextWeight * 10) / 10, nextReps, reason, isAdjustment: true };
  }

  // LÓGICA DE PROGRESIÓN (Reps >= 8)
  if (reps >= 12) {
    const e1RM = weight * (1 + reps / 30);
    const rawNextWeight = e1RM / (1 + 8 / 30);
    
    // El Coach Estricto no permite bajar de tu récord histórico
    nextWeight = Math.max(rawNextWeight, historicalMax);
    
    if (nextWeight > weight * SAFETY_CAP) {
      nextWeight = weight * SAFETY_CAP;
      reason = "¡Nivel superado! Subimos peso al límite del 20% para cuidar tus tendones.";
    } else {
      reason = "Rango dominado. Es hora de cargar más peso y volver a la base de 8 reps.";
    }
    nextReps = "8";
  } 
  else {
    // Zona 8-11: Estricto con el peso, flexible con las reps
    nextWeight = Math.max(weight, historicalMax);
    nextReps = (reps + 1).toString();
    reason = "Estás en el rango. No bajes el peso; la próxima sesión buscaremos una repetición extra.";
  }

  return { nextWeight: Math.round(nextWeight * 10) / 10, nextReps, reason, isAdjustment: false };
};

export default function CoachSuggestion({ exerciseId, userId, currentWeight, currentReps, unit = "kg" }: any) {
  const [dbData, setDbData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Validación de seguridad: no hacer fetch si falta el ejercicio o el usuario
    if (!exerciseId || !userId) return; 
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/api/v1/users/${userId}/exercises/${exerciseId}/suggestion`);
        if (res.ok) setDbData(await res.json());
      } catch (error) {
        console.error("Error cargando la predicción del Coach:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [exerciseId, userId]);

  if (!exerciseId || isLoading) return null;

  // Solo consideramos que estás digitando si ambos valores son mayores a 0
  const isTyping = currentWeight > 0 && currentReps > 0;
  const historicalMax = dbData?.suggested_weight || 0;
  
  const STRICT_THRESHOLD = 0.95; 
  
  // 1. Calculamos el 1RM de lo que estás digitando en este momento
  const current_e1RM = currentWeight * (1 + currentReps / 30);
  
  // 2. Lo convertimos a tu peso ideal para 8 repeticiones (Fuerza Relativa)
  const currentEquivalent8RM = current_e1RM / (1 + 8 / 30);

  // 3. Comparamos peras con peras: Tu fuerza relativa vs la meta histórica
  const esBajoRendimiento = isTyping && currentEquivalent8RM < (historicalMax * STRICT_THRESHOLD);
  const esMuyPesado = isTyping && currentReps < 8;

  let displayData;

  if (esMuyPesado) {
    const adj = calculateNextGoal(currentWeight, currentReps, historicalMax);
    displayData = {
      title: "🛡️ AJUSTE DE SEGURIDAD",
      weight: adj.nextWeight,
      reps: adj.nextReps,
      reason: adj.reason,
      colorClass: "bg-blue-950/20 border-blue-500/40 text-blue-400"
    };
  } else if (esBajoRendimiento) {
    displayData = {
      title: "⚠️ ALERTA: BAJO RENDIMIENTO",
      weight: historicalMax, 
      reps: "8",
      // Mensaje dinámico que expone la diferencia real de fuerza con la unidad correcta
      reason: `No aceptamos regresiones. Tu fuerza actual equivale a ${Math.round(currentEquivalent8RM)} ${unit}. Tu meta real es ${historicalMax} ${unit}. ¡Sube el peso!`,
      colorClass: "bg-red-950/20 border-red-500/40 text-red-500"
    };
  } else if (isTyping) {
    const projection = calculateNextGoal(currentWeight, currentReps, historicalMax);
    displayData = {
      title: "🎯 MISIÓN PRÓXIMA SESIÓN",
      weight: projection.nextWeight,
      reps: projection.nextReps,
      reason: projection.reason,
      colorClass: "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
    };
  } else {
    displayData = {
      title: "💡 OBJETIVO DE HOY",
      weight: dbData?.suggested_weight,
      reps: dbData?.suggested_reps,
      reason: dbData?.reason || "Inicia tu serie para proyectar el futuro.",
      colorClass: "bg-zinc-900 border-zinc-800 text-zinc-400"
    };
  }

  return (
    <div className={`p-3 rounded-lg border transition-all duration-300 ${displayData.colorClass}`}>
      <div className="flex justify-between items-center mb-2 font-black italic tracking-tighter text-[10px] uppercase">
        <span>{displayData.title}</span>
      </div>
      
      <div className="flex gap-4">
        <div>
          <p className="text-[9px] text-zinc-500 uppercase font-bold">Peso Meta</p>
          {/* Aquí mostramos la unidad dinámica */}
          <p className="text-xl font-black text-white">{displayData.weight || "--"} {unit}</p>
        </div>
        <div className="border-l border-zinc-800/50 pl-4">
          <p className="text-[9px] text-zinc-500 uppercase font-bold">Reps Meta</p>
          <p className="text-xl font-black">{displayData.reps || "--"}</p>
        </div>
      </div>
      
      <p className="text-[11px] text-zinc-300 font-medium leading-tight mt-2 border-t border-zinc-800/50 pt-2">
        "{displayData.reason}"
      </p>
    </div>
  );
}