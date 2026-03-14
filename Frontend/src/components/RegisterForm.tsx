"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({ name: "", email: "", weight: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    
    if (res.ok) {
      alert("¡Bienvenido al equipo! Ya puedes empezar a entrenar.");
      // Aquí podrías guardar el ID en localStorage o cookies
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
      <h2 className="text-xl font-black text-emerald-500 uppercase">Registro de Guerrero</h2>
      <input 
        type="text" placeholder="Tu Nombre" 
        className="w-full bg-zinc-950 p-3 rounded border border-zinc-800 text-white"
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <input 
        type="email" placeholder="Email" 
        className="w-full bg-zinc-950 p-3 rounded border border-zinc-800 text-white"
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <div className="flex gap-2">
        <input 
          type="number" placeholder="Peso (kg)" 
          className="w-1/2 bg-zinc-950 p-3 rounded border border-zinc-800 text-white"
          onChange={(e) => setFormData({...formData, weight: e.target.value})}
        />
        <button className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors">
          CREAR CUENTA
        </button>
      </div>
    </form>
  );
}