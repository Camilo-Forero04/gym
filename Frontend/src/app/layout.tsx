import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// IMPORTANTE: Ajusta la ruta con puntos si el '@' te sigue dando problemas
import { AuthProvider } from "../components/AuthProvider"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coach Estricto",
  description: "Plataforma de entrenamiento inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black text-white`}>
        {/* AQUÍ PONEMOS LA RECEPCIÓN DEL GIMNASIO */}
        <AuthProvider>
          {/* Todas tus páginas (incluyendo WorkoutForm) vivirán aquí adentro */}
          {children} 
        </AuthProvider>
      </body>
    </html>
  );
}