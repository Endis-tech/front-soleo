import { Flame, Calendar, Target, TrendingUp, Clock, Dumbbell, Star, Zap, Trophy, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';

// Define el tipo ClientView directamente (sin importar)
type ClientView = 'dashboard' | 'hoy' | 'membresias' | 'progreso' | 'perfil' | 'ajustes';

interface ClientMainDashboardProps {
    userName: string;
    userMembership: string;
    membershipStatus: string;
    daysRemaining: number;
    isActive: boolean;
    onNavigate?: (view: ClientView) => void; // ✅ CORREGIDO
    userData?: any;
}

interface DashboardStats {
    streak: number;
    totalWorkouts: number;
    workoutsThisWeek: number;
    workoutsThisMonth: number;
    totalExerciseTime: number;
    totalDuration: number;
    weeklyProgress: number[];
    level: number;
    exp: number;
    expToNextLevel: number;
}

export function ClientMainDashboard({ 
    userName, 
    userMembership, 
    membershipStatus, 
    daysRemaining, 
    isActive,
    onNavigate,
    userData 
}: ClientMainDashboardProps) {
    const [stats, setStats] = useState<DashboardStats>({
        streak: 0,
        totalWorkouts: 0,
        workoutsThisWeek: 0,
        workoutsThisMonth: 0,
        totalExerciseTime: 0,
        totalDuration: 0,
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
        level: 1,
        exp: 0,
        expToNextLevel: 100
    });
    const [loading, setLoading] = useState(true);
    const [todaysWorkout, setTodaysWorkout] = useState<any>(null);

    const API_URL = import.meta.env.VITE_API_URL;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            console.log('📊 Cargando dashboard del cliente...');

            // 1. Cargar datos del usuario
            const userResponse = await fetch(`${API_URL}/users/me`, {
                headers: getAuthHeaders()
            });
            
            if (!userResponse.ok) {
                throw new Error('Error al cargar datos del usuario');
            }

            const userData = await userResponse.json();
            const user = userData.user || userData;
            console.log('✅ Datos del usuario:', user);

            // 2. Cargar historial de entrenamientos para progreso semanal
            let recentWorkouts = [];
            let weeklyProgress = [0, 0, 0, 0, 0, 0, 0];
            
            try {
                const workoutsResponse = await fetch(`${API_URL}/workout-logs/history`, {
                    headers: getAuthHeaders()
                });
                
                if (workoutsResponse.ok) {
                    const workoutsData = await workoutsResponse.json();
                    recentWorkouts = Array.isArray(workoutsData) ? workoutsData : 
                                    workoutsData.workoutLogs || workoutsData.workouts || [];
                    
                    weeklyProgress = calculateWeeklyProgress(recentWorkouts);
                    console.log('✅ Entrenamientos cargados:', recentWorkouts.length);
                }
            } catch (workoutError) {
                console.log('No se pudieron cargar los entrenamientos:', workoutError);
            }

            // 3. Cargar entrenamiento de hoy
            try {
                const todayResponse = await fetch(`${API_URL}/workout-logs/today/workout`, {
                    headers: getAuthHeaders()
                });
                
                if (todayResponse.ok) {
                    const todayData = await todayResponse.json();
                    setTodaysWorkout(todayData);
                    console.log('✅ Entrenamiento de hoy:', todayData);
                }
            } catch (todayError) {
                console.log('No hay entrenamiento programado para hoy');
            }

            // 4. Calcular nivel
            const totalWorkouts = user.progress?.totalWorkouts || 0;
            const levelData = calculateLevel(totalWorkouts);

            // 5. Actualizar estado
            setStats({
                streak: user.streak?.current || 0,
                totalWorkouts: user.progress?.totalWorkouts || 0,
                workoutsThisWeek: user.progress?.workoutsThisWeek || 0,
                workoutsThisMonth: user.progress?.workoutsThisMonth || 0,
                totalExerciseTime: user.progress?.totalExerciseTime || 0,
                totalDuration: user.progress?.totalDuration || 0,
                weeklyProgress: weeklyProgress,
                level: levelData.level,
                exp: levelData.exp,
                expToNextLevel: levelData.expToNextLevel
            });

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            setStats({
                streak: userData?.streak?.current || 0,
                totalWorkouts: userData?.progress?.totalWorkouts || 0,
                workoutsThisWeek: userData?.progress?.workoutsThisWeek || 0,
                workoutsThisMonth: userData?.progress?.workoutsThisMonth || 0,
                totalExerciseTime: userData?.progress?.totalExerciseTime || 0,
                totalDuration: userData?.progress?.totalDuration || 0,
                weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
                level: 1,
                exp: 0,
                expToNextLevel: 100
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateWeeklyProgress = (workouts: any[]) => {
        const weekProgress = [0, 0, 0, 0, 0, 0, 0]; // Lunes (0) a Domingo (6)
        
        if (!workouts?.length) return weekProgress;

        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Domingo
        const monday = new Date(today);
        // Ajustar a lunes de esta semana
        const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + offset);
        monday.setHours(0, 0, 0, 0);

        workouts.forEach((workout: any) => {
            if (workout.startTime) {
                const workoutDate = new Date(workout.startTime);
                workoutDate.setHours(0, 0, 0, 0);
                
                // Ver si está en la semana actual
                const diffTime = workoutDate.getTime() - monday.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays < 7) {
                    weekProgress[diffDays] = 1;
                }
            }
        });

        return weekProgress;
    };

    const calculateLevel = (totalWorkouts: number) => {
        if (totalWorkouts >= 50) return { level: 5, exp: totalWorkouts, expToNextLevel: 75 };
        if (totalWorkouts >= 30) return { level: 4, exp: totalWorkouts, expToNextLevel: 50 };
        if (totalWorkouts >= 20) return { level: 3, exp: totalWorkouts, expToNextLevel: 30 };
        if (totalWorkouts >= 10) return { level: 2, exp: totalWorkouts, expToNextLevel: 20 };
        return { level: 1, exp: totalWorkouts, expToNextLevel: 10 };
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getMembershipBadge = () => {
        const baseClasses = "px-3 py-1 rounded-full text-sm font-bold border-2";
        switch(userMembership.toLowerCase()) {
            case 'composta':
                return `${baseClasses} bg-amber-100 text-amber-800 border-amber-300`;
            case 'sol':
                return `${baseClasses} bg-orange-100 text-orange-800 border-orange-300`;
            case 'semilla':
                return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
        }
    };

    const levelProgress = (stats.exp / stats.expToNextLevel) * 100;

    const dashboardStats = [
        { 
            label: 'Racha Actual', 
            value: stats.streak.toString(), 
            subtitle: 'días consecutivos',
            icon: Flame, 
            color: 'bg-gradient-to-br from-orange-500 to-amber-500',
            progress: Math.min(stats.streak * 10, 100)
        },
        { 
            label: 'Entrenamientos', 
            value: stats.totalWorkouts.toString(), 
            subtitle: 'total completados',
            icon: Dumbbell, 
            color: 'bg-gradient-to-br from-amber-500 to-yellow-500',
            progress: Math.min(stats.totalWorkouts * 2, 100)
        },
        { 
            label: 'Nivel Actual', 
            value: `Nv. ${stats.level}`, 
            subtitle: `${stats.exp}/${stats.expToNextLevel} EXP`,
            icon: Trophy, 
            color: 'bg-gradient-to-br from-yellow-500 to-amber-400',
            progress: levelProgress
        },
    ];

    const completedDays = stats.weeklyProgress.filter(day => day === 1).length;
    const progressPercentage = (completedDays / 7) * 100;

    const quickActions = [
        { label: 'Mi Progreso', icon: TrendingUp, color: 'bg-gradient-to-br from-amber-500 to-orange-500', view: 'progreso' },
        { label: 'Entrenar Hoy', icon: Calendar, color: 'bg-gradient-to-br from-yellow-500 to-amber-400', view: 'hoy' },
        { label: 'Mis Objetivos', icon: Target, color: 'bg-gradient-to-br from-orange-500 to-red-500', view: 'progreso' },
        { label: 'Mi Membresía', icon: Crown, color: 'bg-gradient-to-br from-amber-400 to-yellow-600', view: 'membresias' },
    ];

    const getTodaysWorkoutData = () => {
        if (todaysWorkout) {
            return {
                hasWorkout: true,
                duration: todaysWorkout.estimatedDuration || 45,
                exerciseCount: todaysWorkout.exercises?.length || 6,
                muscleGroups: todaysWorkout.targetMuscleGroups || ['Pecho', 'Tríceps', 'Hombros'],
                isRecommended: false
            };
        }
        return {
            hasWorkout: false,
            duration: 45,
            exerciseCount: 6,
            muscleGroups: ['Full Body', 'Core', 'Cardio'],
            isRecommended: true
        };
    };

    const todayWorkoutData = getTodaysWorkoutData();

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-8 bg-amber-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-amber-200 rounded w-64"></div>
                    </div>
                    <div className="h-10 bg-amber-200 rounded w-32"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-amber-200 h-32 rounded-xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-amber-200 h-80 rounded-xl"></div>
                    <div className="bg-amber-200 h-80 rounded-xl"></div>
                </div>
            </div>
        );
    }

// ... imports y lógica igual ...

return (
  <div className="space-y-6 text-gray-100"> {/* ✅ texto claro por defecto */}
    {/* Header */}
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="flex-1">
        <h1 className="text-3xl lg:text-4xl font-bold">
          ¡Hola, <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{userName}</span>! 🌻
        </h1>
        <p className="text-amber-200 mt-2 text-lg">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <p className="text-amber-300 text-sm mt-1">
          {stats.workoutsThisWeek} entrenamientos esta semana • {stats.totalDuration} minutos totales
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={getMembershipBadge()}>
          {userMembership} {isActive ? '✅' : '❌'}
        </div>
        {isActive && daysRemaining > 0 && (
          <p className="text-sm text-amber-200">
            <span className="font-semibold">{daysRemaining}</span> días restantes
          </p>
        )}
      </div>
    </div>

    {/* Estadísticas */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {dashboardStats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index} 
            className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-900/30 shadow-lg hover:shadow-amber-900/20 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-amber-200 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color.replace('500', '600').replace('400', '500')} shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-amber-300 text-xs mb-2">{stat.subtitle}</p>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${stat.color.split(' ')[0].replace('from-', 'from-').replace('500', '500').replace('400', '400')} transition-all duration-500`}
                style={{ width: `${stat.progress}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Entrenamiento de hoy */}
      <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-900/30 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="w-6 h-6 mr-3 text-amber-400" />
            Entrenamiento de Hoy
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            todayWorkoutData.hasWorkout 
              ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700' 
              : 'bg-amber-900/50 text-amber-200 border border-amber-700'
          }`}>
            {todayWorkoutData.hasWorkout ? 'Programado' : 'Recomendado'}
          </span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-amber-900/20 rounded-xl border border-amber-800/50">
            <div>
              <p className="text-amber-200 text-sm">Duración estimada</p>
              <p className="text-white font-bold text-lg">{todayWorkoutData.duration} min</p>
            </div>
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex items-center justify-between p-4 bg-amber-900/20 rounded-xl border border-amber-800/50">
            <div>
              <p className="text-amber-200 text-sm">Ejercicios</p>
              <p className="text-white font-bold text-lg">{todayWorkoutData.exerciseCount} ejercicios</p>
            </div>
            <Dumbbell className="w-6 h-6 text-amber-400" />
          </div>
          <div className="p-4 bg-amber-900/20 rounded-xl border border-amber-800/50">
            <p className="text-amber-200 text-sm mb-3 font-medium">Grupos musculares</p>
            <div className="flex flex-wrap gap-2">
              {todayWorkoutData.muscleGroups.map((group: string, index: number) => (
                <span 
                  key={index}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>
          <button 
            onClick={() => onNavigate?.('hoy')}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center"
          >
            <Zap className="w-5 h-5 mr-2" />
            🏋️ {todayWorkoutData.hasWorkout ? 'Comenzar Entrenamiento' : 'Ver Rutinas Disponibles'}
          </button>
        </div>
      </div>

      {/* Progreso semanal */}
      <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-900/30 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-amber-400" />
          Progreso Semanal
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-7 gap-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-amber-200 text-sm mb-2 font-medium">{day}</p>
                <div className={`h-16 rounded-xl flex items-end justify-center p-1 ${
                  stats.weeklyProgress[index] === 1 
                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-500 border-2 border-emerald-500' 
                    : 'bg-gray-800 border-2 border-gray-700'
                }`}>
                  {stats.weeklyProgress[index] === 1 && (
                    <div className="w-3 h-3 bg-white rounded-full mb-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-800/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-emerald-200 font-bold text-lg">{completedDays}/7 días</span>
              <span className="text-emerald-300 font-bold">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-emerald-900/40 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-emerald-200 text-sm mt-2 text-center">
              {completedDays >= 5 ? '🔥 ¡Excelente semana!' : 
               completedDays >= 3 ? '💪 ¡Buen progreso!' : 
               '🌟 ¡Comienza tu semana fuerte!'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate?.('progreso')}
          className="w-full mt-6 border-2 border-amber-500 text-amber-300 py-3 rounded-xl font-bold hover:bg-amber-500/20 transition-all duration-300"
        >
          Ver Progreso Completo
        </button>
      </div>
    </div>

    {/* Acciones rápidas */}
    <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-900/30 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Star className="w-6 h-6 mr-3 text-amber-400" />
        Acciones Rápidas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button 
              key={index}
              onClick={() => onNavigate?.(action.view)}
              className={`${action.color.replace('500', '600').replace('400', '500')} text-white py-4 px-4 rounded-xl hover:opacity-90 transition-all duration-300 font-bold text-center flex flex-col items-center justify-center min-h-24`}
            >
              <Icon className="w-8 h-8 mb-2" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Motivación */}
    <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-6 rounded-2xl shadow-lg">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">💪 Motivación del Día</p>
        <p className="text-amber-100 text-sm">
          {stats.streak > 0 
            ? `¡Llevas ${stats.streak} días consecutivos! Sigue así. 🌟`
            : "Cada entrenamiento te acerca a tu mejor versión. ¡Tú puedes! 🌻"
          }
        </p>
      </div>
    </div>
  </div>
);
}