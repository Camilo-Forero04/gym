from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prisma import Prisma
from typing import List, Optional
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from datetime import datetime, timedelta


# Instanciamos el ORM
db = Prisma()

# Manejo seguro de la conexión a la base de datos
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    print("🟢 Conectado a Supabase exitosamente")
    yield
    await db.disconnect()
    print("🔴 Desconectado de Supabase")

# Inicializamos la API
app = FastAPI(
    title="Gym Tracker API",
    description="Backend para bitácora de gimnasio",
    version="1.0.0",
    lifespan=lifespan
)

# --- CONFIGURACIÓN CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Puertos de Next.js
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

# --- ESQUEMAS (Validación estricta de datos que entran) ---
class UserCreate(BaseModel):
    email: str
    name: str

class ExerciseCreate(BaseModel):
    name: str
    muscleGroup: str
    isCompound: bool = False      # Por defecto será False si no lo envían
    isUnilateral: bool = False    # Por defecto será False si no lo envían

class BodyMeasurementCreate(BaseModel):
    userId: str
    weight: float

# --- ESQUEMAS PARA RUTINAS Y SERIES ---

class WorkoutSetCreate(BaseModel):
    exerciseId: str
    weight: float
    isBodyweight: bool = False
    reps: int
    rpe: Optional[float] = None
    isWarmup: bool = False

class WorkoutCreate(BaseModel):
    userId: str
    notes: Optional[str] = None
    sets: List[WorkoutSetCreate]  # Aquí le decimos que reciba una lista de series


# --- RUTAS / ENDPOINTS ---   

@app.get("/")
async def root():
    return {"message": "API de Gym Tracker operando al 100%"}

@app.post("/api/v1/users")
async def register_user(user: UserCreate):
    try:
        # Aquí Prisma hace la magia: inserta el usuario en Supabase
        new_user = await db.user.create(
            data={
                "email": user.email,
                "name": user.name
            }
        )
        return {"status": "success", "data": new_user}
    except Exception as e:
        # Si el correo ya existe o hay un error de red, lanzamos un 400
        raise HTTPException(status_code=400, detail=str(e))

# --- ENDPOINTS DE EJERCICIOS ---

@app.post("/api/v1/exercises")
async def create_exercise(exercise: ExerciseCreate):
    try:
        new_exercise = await db.exercise.create(
            data={
                "name": exercise.name,
                "muscleGroup": exercise.muscleGroup,
                "isCompound": exercise.isCompound,
                "isUnilateral": exercise.isUnilateral
            }
        )
        return {"status": "success", "data": new_exercise}
    except Exception as e:
        # El @unique en 'name' hará que esto salte si intentas crear el mismo ejercicio dos veces
        raise HTTPException(status_code=400, detail=f"Error al crear ejercicio: {str(e)}")

@app.get("/api/v1/exercises")
async def get_exercises():
    try:
        # Traemos todos los ejercicios ordenados alfabéticamente
        exercises = await db.exercise.find_many(
            order={"name": "asc"}
        )
        return {"status": "success", "data": exercises}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS DE PESO CORPORAL ---

@app.post("/api/v1/measurements")
async def log_weight(measurement: BodyMeasurementCreate):
    try:
        new_measurement = await db.bodymeasurement.create(
            data={
                "userId": measurement.userId,
                "weight": measurement.weight
            }
        )
        return {"status": "success", "data": new_measurement}
    except Exception as e:
        # Si el userId no existe en la tabla User, Prisma lanzará un error protegiendo la integridad
        raise HTTPException(status_code=400, detail=f"Error al registrar peso: {str(e)}")

@app.get("/api/v1/users/{user_id}/measurements")
async def get_user_measurements(user_id: str):
    try:
        # Traemos el historial ordenado por fecha descendente (más reciente primero)
        measurements = await db.bodymeasurement.find_many(
            where={
                "userId": user_id
            },
            order={
                "date": "desc"
            }
        )
        return {"status": "success", "data": measurements}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS DE RUTINAS (WORKOUTS) ---

@app.post("/api/v1/workouts")
async def log_workout(workout: WorkoutCreate):
    try:
        # Inserción anidada: Crea la rutina y todas sus series al mismo tiempo
        new_workout = await db.workout.create(
            data={
                "userId": workout.userId,
                "notes": workout.notes,
                "sets": {
                    "create": [
                        {
                            "exerciseId": s.exerciseId,
                            "weight": s.weight,
                            "isBodyweight": s.isBodyweight,
                            "reps": s.reps,
                            "rpe": s.rpe,
                            "isWarmup": s.isWarmup
                        }
                        for s in workout.sets
                    ]
                }
            },
            include={
                "sets": True # Le pedimos que nos devuelva la rutina con sus series ya creadas
            }
        )
        return {"status": "success", "data": new_workout}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al registrar rutina: {str(e)}")

from typing import Optional
from fastapi import APIRouter

# ... tus otras importaciones ...

@app.get("/workouts")
async def get_workouts(userId: Optional[str] = None):
    # Si Next.js nos envía un userId, filtramos la base de datos
    if userId:
        workouts = await prisma.workout.find_many(
            where={
                "userId": userId  # ¡EL FILTRO ESTRICTO!
            },
            include={
                "sets": {
                    "include": {
                        "exercise": True
                    }
                }
            },
            order={"date": "desc"}
        )
    # Si no nos envían nada, traemos todo (por si lo necesitas para un panel de admin)
    else:
        workouts = await prisma.workout.find_many(
            include={
                "sets": {
                    "include": {
                        "exercise": True
                    }
                }
            },
            order={"date": "desc"}
        )
        
    return {"data": workouts} 
        
# ==========================================
# ACTUALIZAR Y ELIMINAR RUTINAS (MANTENIMIENTO)
# ==========================================

@app.delete("/api/v1/workouts/{workout_id}")
async def delete_workout(workout_id: str):
    try:
        # 1. Por seguridad (y reglas de bases de datos relacionales), 
        # primero borramos las "series" que le pertenecen a esta rutina.
        await db.workoutset.delete_many(where={"workoutId": workout_id})
        
        # 2. Ahora sí, borramos la rutina vacía.
        await db.workout.delete(where={"id": workout_id})
        
        return {"status": "success", "message": "Rutina eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al eliminar: {str(e)}")

@app.put("/api/v1/workouts/{workout_id}")
async def update_workout(workout_id: str, workout: WorkoutCreate): 
    # Usamos el mismo molde (WorkoutCreate) que usaste para crearla inicialmente
    try:
        # 1. Actualizamos la rutina principal (las notas)
        await db.workout.update(
            where={"id": workout_id},
            data={"notes": workout.notes}
        )
        
        # 2. Borramos las series viejas de esta rutina
        await db.workoutset.delete_many(where={"workoutId": workout_id})
        
        # 3. Insertamos la lista de series nuevas (o actualizadas) que vengan del Frontend
        for s in workout.sets:
            await db.workoutset.create(
                data={
                    "workoutId": workout_id,
                    "exerciseId": s.exerciseId,
                    "weight": s.weight,
                    "reps": s.reps,
                    "isBodyweight": s.isBodyweight
                }
            )
            
        return {"status": "success", "message": "Rutina actualizada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar: {str(e)}") 

@app.get("/api/v1/workouts/{workout_id}")
async def get_single_workout(workout_id: str):
    try:
        workout = await db.workout.find_unique(
            where={"id": workout_id},
            include={"sets": True}
        )
        if not workout:
            raise HTTPException(status_code=404, detail="Rutina no encontrada")
            
        return {"status": "success", "data": workout}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al buscar rutina: {str(e)}")  

@app.get("/api/v1/users/{user_id}/stats")
async def get_stats(user_id: str):
    try:
        # 1. NOTA: Usamos 'userId' (camelCase) tal como está en tu modelo 'Workout'
        workouts = await db.workout.find_many(
            where={"userId": user_id}, 
            include={"sets": True},
            order={"date": "desc"}
        )
        
        if not workouts:
            return {"data": {"month_count": 0, "streak": 0, "total_volume": 0}}

        now = datetime.now()
        
        # 2. Conteo de entrenamientos en el mes actual
        month_count = len([w for w in workouts if w.date and w.date.month == now.month and w.date.year == now.year])

        # 3. Volumen Total: Multiplicamos peso (Float) por repeticiones (Int)
        # Excluimos series que sean solo peso corporal (isBodyweight) si lo prefieres, 
        # pero aquí sumamos todo para ver el esfuerzo total.
        total_volume = 0
        for w in workouts:
            for s in w.sets:
                peso = s.weight or 0.0
                repeticiones = s.reps or 0
                total_volume += (peso * repeticiones)

        # 4. Cálculo de Racha (Streak)
        streak = 0
        dates = sorted({w.date.date() for w in workouts if w.date}, reverse=True)
        today = now.date()
        
        # Verificamos si entrenaste hoy (5 de marzo) o ayer (4 de marzo)
        if dates and (dates[0] == today or dates[0] == today - timedelta(days=1)):
            current = dates[0]
            for d in dates:
                if d == current:
                    streak += 1
                    current -= timedelta(days=1)
                else:
                    break

        return {
            "data": {
                "month_count": month_count,
                "streak": streak,
                "total_volume": int(total_volume)
            }
        }
        
    except Exception as e:
        # Esto te imprimirá el error exacto en la terminal de Uvicorn
        print(f"❌ Error en stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 


@app.get("/api/v1/users/{user_id}/exercises/{exercise_id}/suggestion")
async def get_weight_suggestion(user_id: str, exercise_id: str):
    try:
        # 1. Traemos las últimas 5 series para entender tu nivel real
        recent_sets = await db.workoutset.find_many(
            where={
                "workout": {"userId": user_id},
                "exerciseId": exercise_id,
                "isWarmup": False
            },
            take=5,
            order={"createdAt": "desc"}
        )

        if not recent_sets:
            return {"suggested_weight": None, "suggested_reps": "8-12", "reason": "Base de datos nueva."}

        # 2. Identificamos el rendimiento de hoy vs. el mejor reciente
        last_session = recent_sets[0]
        # Buscamos el peso máximo que has manejado en las últimas 5 sesiones
        max_recent_weight = max(s.weight for s in recent_sets) 
        
        peso_hoy = last_session.weight
        reps_hoy = last_session.reps
        
        # 3. Lógica de "Resiliencia": Si hoy bajaste mucho el peso
        # (Ejemplo: Si hoy levantaste menos del 85% de tu récord reciente)
        if peso_hoy < (max_recent_weight * 0.85):
            return {
                "suggested_weight": max_recent_weight,
                "suggested_reps": "8",
                "last_reps": reps_hoy,
                "reason": f"Hoy fue un día ligero. Tu récord reciente es {max_recent_weight}kg; la próxima vez intenta volver a esa base."
            }

        # 4. Lógica de Progresión Normal (8-12 reps) con Tope de Seguridad
        SAFETY_CAP = 1.20
        if reps_hoy >= 12:
            e1RM = peso_hoy * (1 + reps_hoy / 30)
            peso_teorico = e1RM / (1 + 8 / 30)
            nuevo_peso = min(peso_teorico, peso_hoy * SAFETY_CAP)
            nuevas_reps = "8"
            reason = "Rango superado. Subimos peso para volver a 8 reps."
        elif reps_hoy < 8:
            nuevo_peso = peso_hoy
            nuevas_reps = "8"
            reason = "Mantén el peso hasta dominar las 8 reps."
        else:
            nuevo_peso = peso_hoy
            nuevas_reps = f"{reps_hoy + 1}"
            reason = "Busca una repetición extra con el mismo peso."

        return {
            "suggested_weight": round(nuevo_peso, 1),
            "suggested_reps": nuevas_reps,
            "last_reps": reps_hoy,
            "reason": reason
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel, EmailStr
from typing import Optional

# Esquemas de validación
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    weight: Optional[float] = None
    height: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[int] = None

# --- ENDPOINTS DEL CRUD ---

# 1. CREATE: Registrar un nuevo amigo
@app.post("/api/v1/users")
async def create_user(user_data: UserCreate):
    return await db.user.create(data=user_data.dict())

# 2. READ: Ver el perfil (para el Dashboard)
@app.get("/api/v1/users/{user_id}")
async def get_user(user_id: str):
    user = await db.user.find_unique(where={"id": user_id}, include={"workouts": True})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# 3. UPDATE: Cuando bajes de peso o ganes altura
@app.put("/api/v1/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    return await db.user.update(
        where={"id": user_id},
        data=user_data.dict(exclude_unset=True)
    )

# 4. DELETE: Borrar cuenta (¡esperemos que nadie la use!)
@app.delete("/api/v1/users/{user_id}")
async def delete_user(user_id: str):
    await db.user.delete(where={"id": user_id})
    return {"message": "Usuario eliminado correctamente"}

@app.get("/api/v1/users/{user_id}/records")
async def get_user_records(user_id: str):
    # 1. Traemos todos los sets del usuario
    all_sets = await db.workoutset.find_many(
        where={"workout": {"userId": user_id}},
        include={"exercise": True}
    )
    
    records = {}
    for s in all_sets:
        # Cálculo del e1RM
        current_e1rm = s.weight * (1 + s.reps / 30)
        ex_name = s.exercise.name
        
        # Guardamos solo el máximo por ejercicio
        if ex_name not in records or current_e1rm > records[ex_name]["e1rm"]:
            records[ex_name] = {
                "e1rm": round(current_e1rm, 1),
                "best_weight": s.weight,
                "best_reps": s.reps,
                "date": s.createdAt
            }
            
    return records