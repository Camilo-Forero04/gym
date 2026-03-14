"use client";
import { useEffect, useState } from "react";

export default function StrengthRecords({ userId }: { userId: string }) {
  const [records, setRecords] = useState<any>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}/records`)
      .then(res => res.json())
      .then(data => setRecords(data));
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {Object.entries(records).map(([name, data]: any) => (
        <div key={name} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <h3 className="text-zinc-400 text-xs font-bold uppercase">{name}</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">PR</span>
          </div>
          
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.e1rm}</span>
            <span className="text-zinc-500 font-bold text-sm">KG (Est.)</span>
          </div>
          
          <p className="text-[10px] text-zinc-500 mt-2 italic">
            Logrado con: {data.best_weight}kg x {data.best_reps} reps
          </p>
        </div>
      ))}
    </div>
  );
}