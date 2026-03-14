"use client";

import { useState, useEffect } from "react";

// --- LÓGICA DE COACH (Todo entra y sale en KILOS aquí adentro) ---
const calculateNextGoal = (weightKg: number, reps: number, historicalMaxKg: number = 0) => {
  let nextWeightKg: number;
  let nextReps: string;
  let reason: string;
  const SAFETY_CAP = 1.20; 

  if (reps < 8) {
    const e1RM = weightKg * (1 + reps / 30);
    nextWeightKg = e1RM / (1 + 8 / 30);
    nextReps = "8";
    reason = "Peso excesivo. Bajamos carga para dominar las 8 reps con técnica perfecta.";
    return { nextWeight: nextWeightKg, nextReps, reason };
  }

  if (reps >= 12) {
    const e1RM = weightKg * (1 + reps / 30);
    const rawNextWeight = e1RM / (1 + 8 / 30);
    
    nextWeightKg = Math.max(rawNextWeight, historicalMaxKg);
    
    if (nextWeightKg > weightKg * SAFETY_CAP) {
      nextWeightKg = weightKg * SAFETY_CAP;
      reason = "¡Nivel superado! Subimos peso al límite seguro del 20%.";
    } else {
      reason = "Rango dominado. Es hora de cargar más peso y volver a la base de 8 reps.";
    }
    nextReps = "8";
  } else {
    nextWeightKg = Math.max(weightKg, historicalMaxKg);
    nextReps = (reps + 1).toString();
    reason = "Estás en el rango. Mantén el peso; buscaremos una repetición extra.";
  }

  return { nextWeight: nextWeightKg, nextReps, reason };
};

export default function CoachSuggestion({ exerciseId, userId, currentWeight, currentReps, unit = "kg" }: any) {
  const [dbData, setDbData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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

  const isTyping = currentWeight > 0 && currentReps > 0;
  
  // 1. EL RÉCORD SIEMPRE ESTÁ EN KILOS (viene de la BD)
  const historicalMaxKg = dbData?.suggested_weight || 0;
  
  // 2. CONVERTIMOS LO QUE DIGITAS A KILOS PARA LA MATEMÁTICA
  const currentWeightKg = unit === "lb" ? currentWeight / 2.20462 : currentWeight;
  
  const STRICT_THRESHOLD = 0.95; 
  const current_e1RM_Kg = currentWeightKg * (1 + currentReps / 30);
  const currentEquivalent8RM_Kg = current_e1RM_Kg / (1 + 8 / 30);

  const esBajoRendimiento = isTyping && currentEquivalent8RM_Kg < (historicalMaxKg * STRICT_THRESHOLD);
  const esMuyPesado = isTyping && currentReps < 8;

  // 3. FUNCIÓN PARA TRADUCIR DE VUELTA A TU PANTALLA
  const formatOutput = (weightInKg: number) => {
    const finalWeight = unit === "lb" ? weightInKg * 2.20462 : weightInKg;
    return Math.round(finalWeight * 10) / 10;
  };

  let displayData;

  if (esMuyPesado) {
    const adj = calculateNextGoal(currentWeightKg, currentReps, historicalMaxKg);
    displayData = {
      title: "🛡️ AJUSTE DE SEGURIDAD",
      weight: formatOutput(adj.nextWeight),
      reps: adj.nextReps,
      reason: adj.reason,
      colorClass: "bg-blue-950/20 border-blue-500/40 text-blue-400"
    };
  } else if (esBajoRendimiento) {
    displayData = {
      title: "⚠️ ALERTA: BAJO RENDIMIENTO",
      weight: formatOutput(historicalMaxKg), 
      reps: "8",
      reason: `Tu fuerza actual equivale a ${formatOutput(currentEquivalent8RM_Kg)} ${unit}. Tu meta es ${formatOutput(historicalMaxKg)} ${unit}. ¡Sube el peso!`,
      colorClass: "bg-red-950/20 border-red-500/40 text-red-500"
    };
  } else if (isTyping) {
    const projection = calculateNextGoal(currentWeightKg, currentReps, historicalMaxKg);
    displayData = {
      title: "🎯 MISIÓN PRÓXIMA SESIÓN",
      weight: formatOutput(projection.nextWeight),
      reps: projection.nextReps,
      reason: projection.reason,
      colorClass: "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
    };
  } else {
    displayData = {
      title: "💡 OBJETIVO DE HOY",
      weight: historicalMaxKg ? formatOutput(historicalMaxKg) : null,
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