"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle entre Login y Registro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Inicialización oficial y moderna para Next.js (App Router)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- INICIAR SESIÓN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Si todo sale bien, lo mandamos al dashboard
        router.push("/"); 
        router.refresh();
      } else {
        // --- REGISTRAR NUEVO GUERRERO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        alert("¡Cuenta forjada con éxito! Ya puedes iniciar sesión.");
        setIsLogin(true); // Lo devolvemos a la vista de login
        setPassword("");  // Limpiamos la contraseña por seguridad
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            {isLogin ? "Entrar al Sistema" : "Forjar Cuenta"}
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            {isLogin ? "El Coach Estricto te espera." : "Únete al equipo y registra tus marcas."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-500/50 rounded-lg text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black italic tracking-wider py-3 rounded-lg uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-zinc-800/50 pt-6">
          <p className="text-xs text-zinc-500">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya eres parte del equipo?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              type="button"
              className="ml-2 text-emerald-500 font-bold hover:text-emerald-400 transition-colors"
            >
              {isLogin ? "Regístrate aquí" : "Inicia sesión"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}