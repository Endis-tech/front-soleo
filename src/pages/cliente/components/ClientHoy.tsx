import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Play, CheckCircle, Zap, Flame, StopCircle, 
  Image, AlertCircle, ChevronDown, ChevronUp, Loader2,
  Target, Clock, Trophy, Award
} from 'lucide-react';

// Interfaces
interface User {
  _id: string;
  name: string;
  membership: string;
  streak?: { 
    current: number; 
    longest: number;
    lastWorkoutDate?: string;
  };
  progress?: {
    totalWorkouts: number;
    totalDuration: number;
    totalExerciseTime: number;
    workoutsThisWeek: number;
    workoutsThisMonth: number;
  };
}

interface MuscleGroup {
  _id: string;
  name: string;
}

interface Exercise {
  _id: string;
  name: string;
  description: string;
  series: number;
  repetitions: number;
  videoUrl: string;
  imageUrl: string;
  muscleGroup: MuscleGroup;
}

interface Routine {
  _id: string;
  name: string;
  muscleGroups: {
    muscleGroup: MuscleGroup;
    exercises: Exercise[];
  }[];
}

interface WorkoutLog {
  _id: string;
  muscleGroup: MuscleGroup;
  routine: Routine;
  startTime: string;
  endTime?: string;
  exercisesCompleted: string[];
  streak: number;
  duration?: number;
  totalExerciseTime?: number;
}

interface ClientHoyProps {
  user: User;
}

// ✅ ExerciseItem - estilo oscuro Soleo
const ExerciseItem: React.FC<{
  exercise: Exercise;
  index: number;
  isCompleted: boolean;
  isTimerRunning: boolean;
  exerciseTime: number;
  onToggleComplete: (exerciseId: string) => void;
  onToggleTimer: (exerciseId: string, muscleGroupId: string) => void;
  onExpandImage: (imageUrl: string) => void;
  canInteract: boolean;
}> = ({ exercise, index, isCompleted, isTimerRunning, exerciseTime, onToggleComplete, onToggleTimer, onExpandImage, canInteract }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${
      isCompleted ? 'border-green-500 bg-green-900/30' : 
      isTimerRunning ? 'border-blue-500 bg-blue-900/30' : 
      'border-amber-900/30 bg-gray-900/50 hover:border-amber-600'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggleComplete(exercise._id)}
            disabled={!canInteract}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isCompleted ? 'bg-green-500 border-green-500 text-white scale-110' : 
              canInteract ? 'border-amber-400 hover:border-green-500 hover:scale-105' : 
              'border-gray-600 opacity-50'
            }`}
          >
            {isCompleted && <CheckCircle className="w-3 h-3" />}
          </button>
          
          <div className="flex-1">
            <h3 className="font-bold text-amber-100">
              {index + 1}. {exercise.name}
            </h3>
            <p className="text-amber-300 text-sm">
              {exercise.series} series × {exercise.repetitions} reps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-amber-400">
              {isTimerRunning ? 'Activo' : 'Total'}
            </div>
            <div className={`font-mono font-bold text-sm ${
              isTimerRunning ? 'text-green-400' : 'text-amber-200'
            }`}>
              {formatTime(exerciseTime)}
            </div>
          </div>
          
          <button
            onClick={() => onToggleTimer(exercise._id, exercise.muscleGroup._id)}
            disabled={!canInteract || isCompleted}
            className={`p-2 rounded-full transition-all ${
              isTimerRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                : canInteract && !isCompleted
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:scale-105' 
                : 'bg-gray-700 cursor-not-allowed'
            }`}
          >
            {isTimerRunning ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="text-amber-200 text-sm mb-3">{exercise.description}</p>

      {exercise.imageUrl && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-sm text-amber-400 mb-2">
            <Image className="w-4 h-4" />
            <span>Imagen</span>
          </div>
          <div 
            className="cursor-pointer group"
            onClick={() => onExpandImage(exercise.imageUrl)}
          >
            <img 
              src={exercise.imageUrl} 
              alt={exercise.name}
              className="w-full rounded-lg shadow-lg max-h-48 object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ MuscleGroupSection - con 3 columnas en desktop
const MuscleGroupSection: React.FC<{
  muscleGroupData: {
    muscleGroup: MuscleGroup;
    exercises: Exercise[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  completedExercises: string[];
  activeExerciseTimer: string | null;
  exerciseTimes: { [key: string]: number };
  onToggleComplete: (exerciseId: string) => void;
  onToggleTimer: (exerciseId: string, muscleGroupId: string) => void;
  onExpandImage: (imageUrl: string) => void;
  canInteract: boolean;
  isActiveGroup: boolean;
  onStartWorkout: (muscleGroupId: string) => Promise<boolean>;
}> = ({ 
  muscleGroupData, 
  isExpanded, 
  onToggle, 
  completedExercises, 
  activeExerciseTimer, 
  exerciseTimes,
  onToggleComplete,
  onToggleTimer,
  onExpandImage,
  canInteract,
  isActiveGroup,
  onStartWorkout
}) => {
  if (!muscleGroupData?.muscleGroup) return null;

  const muscleGroup = muscleGroupData.muscleGroup;
  const exercises = muscleGroupData.exercises || [];
  const completedInGroup = exercises.filter(ex => completedExercises.includes(ex._id)).length;
  const groupProgress = exercises.length > 0 ? Math.round((completedInGroup / exercises.length) * 100) : 0;

  return (
    <div className={`bg-gray-900/80 backdrop-blur-sm rounded-2xl border transition-all ${
      isActiveGroup ? 'border-amber-500 shadow-xl' : 'border-amber-900/30'
    }`}>
      <div 
        className="p-6 cursor-pointer hover:bg-amber-900/10 transition-colors rounded-2xl"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isActiveGroup ? 'bg-amber-600 text-white' : 'bg-amber-900/50 text-amber-300'
            }`}>
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                {muscleGroup.name}
                {isActiveGroup && (
                  <span className="text-green-400 text-sm bg-green-900/40 px-2 py-1 rounded-full">ACTIVO</span>
                )}
              </h2>
              <p className="text-amber-300 text-sm">
                {exercises.length} ejercicios • {completedInGroup} completados
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={groupProgress === 100 ? "#10B981" : "#F59E0B"}
                  strokeWidth="3"
                  strokeDasharray={`${groupProgress}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-100">{groupProgress}%</span>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
              groupProgress === 100 ? 'bg-green-900/40 text-green-300 border-green-700' :
              groupProgress > 0 ? 'bg-amber-900/40 text-amber-300 border-amber-700' :
              'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              {completedInGroup}/{exercises.length}
            </div>

            <ChevronUp className={`w-5 h-5 text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-amber-900/30">
          {!isActiveGroup && (
            <div className="mb-4 p-4 bg-amber-900/20 border border-amber-800/50 rounded-xl">
              <div className="text-center">
                <p className="text-amber-200 mb-3">Para comenzar a entrenar este grupo:</p>
                <button
                  onClick={() => onStartWorkout(muscleGroup._id)}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center gap-2 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  Iniciar Entrenamiento
                </button>
              </div>
            </div>
          )}

          {/* ✅ ¡3 COLUMNAS EN DESKTOP! */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((exercise, index) => {
              if (!exercise) return null;
              
              const isTimerRunning = activeExerciseTimer === exercise._id;
              const isCompleted = completedExercises.includes(exercise._id);

              return (
                <ExerciseItem
                  key={exercise._id}
                  exercise={exercise}
                  index={index}
                  isCompleted={isCompleted}
                  isTimerRunning={isTimerRunning}
                  exerciseTime={exerciseTimes[exercise._id] || 0}
                  onToggleComplete={onToggleComplete}
                  onToggleTimer={onToggleTimer}
                  onExpandImage={onExpandImage}
                  canInteract={isActiveGroup}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ CongratulationsView - estilo oscuro
const CongratulationsView: React.FC<{
  completedStats: {
    currentStreak: number;
    longestStreak: number;
    completedExercises: number;
    totalExercises: number;
  };
  onClose: () => void;
}> = ({ completedStats, onClose }) => {
  const isNewRecord = completedStats.currentStreak > completedStats.longestStreak;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-amber-900/30">
        <div className="mb-6">
          <div className="w-48 h-48 mx-auto">
            <img 
              src="/images/soleo.gif"
              alt="Celebración" 
              className="w-full h-full rounded-full object-cover border-4 border-amber-500 shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'w-full h-full bg-amber-600 rounded-full flex items-center justify-center text-6xl text-amber-100';
                fallbackDiv.innerHTML = '🎉';
                e.currentTarget.parentNode.appendChild(fallbackDiv);
              }}
            />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-amber-300 mb-3">¡Felicidades! 🎉</h2>
        <p className="text-amber-200 text-lg mb-6">Has completado tu entrenamiento</p>
        
        {isNewRecord && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-4">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-amber-200 font-bold">¡NUEVO RÉCORD! 🏆</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-900/30 p-4 rounded-xl border border-green-800/50">
            <div className="text-2xl font-bold text-green-300">
              {completedStats.completedExercises}/{completedStats.totalExercises}
            </div>
            <div className="text-sm text-green-400 mt-1">Ejercicios</div>
          </div>
          <div className="bg-amber-900/30 p-4 rounded-xl border border-amber-800/50">
            <div className="text-2xl font-bold text-amber-300">
              {completedStats.currentStreak}
            </div>
            <div className="text-sm text-amber-400 mt-1">Racha Actual</div>
          </div>
        </div>

        <div className="bg-blue-900/30 p-3 rounded-xl border border-blue-800/50 mb-4">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-bold">Récord: {completedStats.longestStreak} días</span>
          </div>
        </div>
        
        <p className="text-amber-300 text-sm italic mb-6">
          {completedStats.currentStreak === 1 
            ? "¡Excelente comienzo! Sigue así." 
            : `¡Increíble! ${completedStats.currentStreak} días seguidos.`
          }
          {isNewRecord && " ¡Has superado tu récord!"}
        </p>

        <button
          onClick={onClose}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all w-full"
        >
          ¡Continuar!
        </button>
      </div>
    </div>
  );
};

// 🔥 COMPONENTE PRINCIPAL
export function ClientHoy({ user }: ClientHoyProps) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [activeExerciseTimer, setActiveExerciseTimer] = useState<string | null>(null);
  const [exerciseTimes, setExerciseTimes] = useState<{[key: string]: number}>({});
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedMuscleGroups, setExpandedMuscleGroups] = useState<{[key: string]: boolean}>({});
  const [showCongratulations, setShowCongratulations] = useState(false);
  
  const [currentStreak, setCurrentStreak] = useState<number>(user?.streak?.current || 0);
  const [longestStreak, setLongestStreak] = useState<number>(user?.streak?.longest || 0);

  const [completedStats, setCompletedStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completedExercises: 0,
    totalExercises: 0
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error(`Error en ${url}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const routineData = await fetchData(`${API_URL}/routines/bulking`);
        if (!routineData) {
          setError('No se pudo cargar la rutina');
          return;
        }
        setRoutine(routineData);

        const workoutResponse = await fetchData(`${API_URL}/workout-logs/current`);
        if (workoutResponse && workoutResponse.success && workoutResponse.exists) {
          setCurrentWorkout(workoutResponse.workout);
          setCompletedExercises(workoutResponse.workout.exercisesCompleted || []);
          if (workoutResponse.workout.muscleGroup?._id) {
            setExpandedMuscleGroups({ [workoutResponse.workout.muscleGroup._id]: true });
          }
        } else {
          if (routineData.muscleGroups?.[0]?.muscleGroup?._id) {
            setExpandedMuscleGroups({ [routineData.muscleGroups[0].muscleGroup._id]: true });
          }
        }

        const statsData = await fetchData(`${API_URL}/workout-logs/statistics`);
        if (statsData?.userStats?.streak) {
          setCurrentStreak(statsData.userStats.streak.current || 0);
          setLongestStreak(statsData.userStats.streak.longest || 0);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [API_URL]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeExerciseTimer) {
      interval = setInterval(() => {
        setExerciseTimes(prev => ({
          ...prev,
          [activeExerciseTimer]: (prev[activeExerciseTimer] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeExerciseTimer]);

  const startWorkout = async (muscleGroupId: string): Promise<boolean> => {
    if (!routine) return false;
    setSaving(true);
    try {
      const response = await fetchData(`${API_URL}/workout-logs/start-bulking`, {
        method: 'POST',
        body: JSON.stringify({ routineId: routine._id, muscleGroupId })
      });
      if (!response?.workout) throw new Error('No se pudo iniciar');
      setCurrentWorkout(response.workout);
      setExpandedMuscleGroups({ [muscleGroupId]: true });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleExerciseComplete = async (exerciseId: string) => {
    if (!currentWorkout) {
      setError('Inicia un entrenamiento');
      return;
    }
    if (activeExerciseTimer === exerciseId) {
      setActiveExerciseTimer(null);
    }
    const newCompleted = completedExercises.includes(exerciseId)
      ? completedExercises.filter(id => id !== exerciseId)
      : [...completedExercises, exerciseId];
    setCompletedExercises(newCompleted);
    try {
      await fetchData(`${API_URL}/workout-logs/${currentWorkout._id}/exercises`, {
        method: 'PATCH',
        body: JSON.stringify({ exerciseId, completed: !completedExercises.includes(exerciseId) })
      });
    } catch (err) {
      // Silenciar
    }
  };

  const toggleExerciseTimer = async (exerciseId: string, muscleGroupId: string) => {
    if (!currentWorkout) {
      setError('Inicia el entrenamiento');
      return;
    }
    if (currentWorkout.muscleGroup._id !== muscleGroupId) {
      setError('Ejercicio no válido');
      return;
    }
    if (activeExerciseTimer === exerciseId) {
      setActiveExerciseTimer(null);
    } else {
      if (activeExerciseTimer) setActiveExerciseTimer(null);
      setActiveExerciseTimer(exerciseId);
      if (!exerciseTimes[exerciseId]) {
        setExerciseTimes(prev => ({ ...prev, [exerciseId]: 0 }));
      }
    }
  };

  const finishWorkout = async () => {
    if (!currentWorkout) return;
    setSaving(true);
    try {
      const response = await fetchData(`${API_URL}/workout-logs/current/finish`, { method: 'PATCH' });
      if (!response) throw new Error('Error finalizando');
      
      const completedCount = completedExercises.length;
      const totalCount = totalExercises;
      
      const statsData = await fetchData(`${API_URL}/workout-logs/statistics`);
      if (statsData?.userStats?.streak) {
        setCurrentStreak(statsData.userStats.streak.current || 0);
        setLongestStreak(statsData.userStats.streak.longest || 0);
      }
      
      if (completedCount >= 3) {
        setCompletedStats({
          currentStreak: statsData?.userStats?.streak?.current || currentStreak,
          longestStreak: statsData?.userStats?.streak?.longest || longestStreak,
          completedExercises: completedCount,
          totalExercises: totalCount
        });
        setShowCongratulations(true);
      } else {
        alert(`¡Entrenamiento terminado!\n\nEjercicios: ${completedCount}/${totalCount}\nDuración: ${workoutDuration} minutos`);
        resetWorkoutState();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetWorkoutState = () => {
    setCurrentWorkout(null);
    setCompletedExercises([]);
    setActiveExerciseTimer(null);
    setExerciseTimes({});
    setExpandedMuscleGroups({});
  };

  const toggleMuscleGroup = (muscleGroupId: string) => {
    setExpandedMuscleGroups(prev => ({ ...prev, [muscleGroupId]: !prev[muscleGroupId] }));
  };

  const totalExercises = routine?.muscleGroups?.reduce((total, group) => total + (group.exercises?.length || 0), 0) || 0;
  const progress = totalExercises > 0 ? (completedExercises.length / totalExercises) * 100 : 0;
  const workoutDuration = currentWorkout ? Math.floor((new Date().getTime() - new Date(currentWorkout.startTime).getTime()) / 60000) : 0;
  const totalExerciseTime = Object.values(exerciseTimes).reduce((total, time) => total + time, 0);
  const muscleGroups = routine?.muscleGroups?.filter(group => group?.muscleGroup?._id) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <span className="text-amber-300">Cargando rutina...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-200 mb-2">Error</h3>
          <p className="text-amber-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full hover:from-amber-700 hover:to-orange-700 w-full"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-amber-300">Rutina no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-amber-100 p-4">
      {/* Modal de Imagen */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-amber-200 bg-amber-900/50 hover:bg-amber-800 rounded-full p-2"
          >
            ✕
          </button>
          <img src={expandedImage} alt="Ejercicio" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {/* Felicitaciones */}
      {showCongratulations && (
        <CongratulationsView 
          completedStats={completedStats}
          onClose={() => {
            setShowCongratulations(false);
            resetWorkoutState();
          }}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-900/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-100 mb-2">Entrenamiento de Hoy 🌻</h1>
              <p className="text-amber-300">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>
              {currentWorkout && (
                <p className="text-amber-400 text-sm mt-2">
                  🕐 Iniciado: {new Date(currentWorkout.startTime).toLocaleTimeString()} • 
                  {workoutDuration} min
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="text-center bg-gradient-to-br from-amber-700 to-orange-800 p-4 rounded-xl text-amber-100">
                  <div className="flex items-center gap-2 justify-center">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold text-xl">{currentStreak}</span>
                  </div>
                  <p className="text-amber-200 text-xs mt-1">Racha Actual</p>
                </div>

                <div className="text-center bg-gradient-to-br from-blue-700 to-purple-800 p-4 rounded-xl text-amber-100">
                  <div className="flex items-center gap-2 justify-center">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold text-xl">{longestStreak}</span>
                  </div>
                  <p className="text-blue-200 text-xs mt-1">Récord</p>
                </div>
              </div>

              {currentWorkout && (
                <button 
                  onClick={finishWorkout}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-5 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'Finalizando...' : `Finalizar (${workoutDuration}min)`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-900/30">
            <div className="flex items-center gap-3">
              <Target className="w-7 h-7 text-amber-400" />
              <div>
                <p className="text-amber-300 text-sm">Progreso</p>
                <p className="text-xl font-bold text-amber-100">
                  {completedExercises.length}/{totalExercises}
                </p>
              </div>
            </div>
            <div className="mt-3 bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-900/30">
            <div className="flex items-center gap-3">
              <Clock className="w-7 h-7 text-blue-400" />
              <div>
                <p className="text-amber-300 text-sm">Tiempo activo</p>
                <p className="text-xl font-bold text-amber-100">
                  {Math.floor(totalExerciseTime / 60)}:{(totalExerciseTime % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-900/30">
            <div className="flex items-center gap-3">
              <Zap className="w-7 h-7 text-orange-400" />
              <div>
                <p className="text-amber-300 text-sm">Grupo activo</p>
                <p className="text-xl font-bold text-amber-100">
                  {currentWorkout ? '1' : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grupos Musculares */}
        <div className="space-y-6">
          {muscleGroups.map((muscleGroupData) => {
            const muscleGroup = muscleGroupData.muscleGroup;
            const isActiveGroup = currentWorkout?.muscleGroup?._id === muscleGroup._id;
            
            return (
              <MuscleGroupSection
                key={muscleGroup._id}
                muscleGroupData={muscleGroupData}
                isExpanded={!!expandedMuscleGroups[muscleGroup._id]}
                onToggle={() => toggleMuscleGroup(muscleGroup._id)}
                completedExercises={completedExercises}
                activeExerciseTimer={activeExerciseTimer}
                exerciseTimes={exerciseTimes}
                onToggleComplete={toggleExerciseComplete}
                onToggleTimer={toggleExerciseTimer}
                onExpandImage={setExpandedImage}
                canInteract={isActiveGroup}
                isActiveGroup={isActiveGroup}
                onStartWorkout={startWorkout}
              />
            );
          })}
        </div>

        {!currentWorkout && (
          <div className="bg-amber-900/20 border border-amber-800/50 rounded-2xl p-6 text-center">
            <Dumbbell className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-amber-200 mb-2">¡Comienza tu entrenamiento!</h3>
            <p className="text-amber-300 mb-4">
              Selecciona un grupo muscular y haz clic en "Iniciar Entrenamiento".
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-800/50">
                <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-amber-200 text-sm">Racha: {currentStreak} días</p>
              </div>
              <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-800/50">
                <Trophy className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-blue-200 text-sm">Récord: {longestStreak} días</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientHoy;