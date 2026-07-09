# 🏋️ Gym Tracker

Aplicación full-stack para llevar una bitácora de entrenamiento de gimnasio:
registra rutinas, series y peso corporal, y calcula automáticamente tus
récords personales (e1RM) para medir tu progreso a lo largo del tiempo.

🔗 **Demo en vivo:** https://gym-henna-phi.vercel.app

![Captura de la aplicación](./docs/screenshot.png)

## ✨ Funcionalidades

- Registro y perfil de usuario (peso, altura) con CRUD completo.
- Creación de ejercicios clasificados por grupo muscular, compuestos y unilaterales.
- Registro de rutinas con múltiples series por sesión (peso, reps, RPE, calentamiento, bodyweight).
- Historial de peso corporal ordenado por fecha.
- Cálculo automático de récords personales (e1RM, repetición máxima estimada) por ejercicio.

## 🛠️ Stack tecnológico

**Frontend**
- Next.js + TypeScript
- Tailwind CSS
- Desplegado en Vercel

**Backend**
- FastAPI (Python)
- Prisma ORM
- Base de datos PostgreSQL en Supabase
- Desplegado en Railway

## 🏗️ Arquitectura

El proyecto está separado en dos servicios independientes: un frontend en
Next.js que consume una API REST construida con FastAPI. La API valida los
datos de entrada con Pydantic y persiste la información en Supabase a través
de Prisma. La comunicación entre ambos está habilitada mediante CORS.

## 🚀 Cómo ejecutarlo localmente

### Backend
```bash
cd Backend
python -m venv venv
source venv/bin/activate      # En Windows: venv\Scripts\activate
pip install -r requirements.txt
prisma generate
uvicorn app.main:app --reload
```
La API quedará disponible en `http://localhost:8000`
(documentación interactiva en `http://localhost:8000/docs`).

### Frontend
```bash
cd Frontend
npm install
npm run dev
```
La app quedará disponible en `http://localhost:3000`.

### Variables de entorno
Crea un archivo `.env` en `Backend/` con:

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/users` | Registrar usuario |
| `GET`  | `/api/v1/users/{id}` | Ver perfil |
| `POST` | `/api/v1/exercises` | Crear ejercicio |
| `POST` | `/api/v1/workouts` | Registrar rutina con series |
| `GET`  | `/api/v1/users/{id}/records` | Récords personales (e1RM) |

## 👤 Autor

**Camilo Forero** — [GitHub](https://github.com/Camilo-Forero04) · [LinkedIn](https://linkedin.com/in/camilo-forero-18b1031b0)
