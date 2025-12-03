import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Calendar, Clock, Dumbbell, Flame, Trophy, Target,
  CheckCircle, Loader2, Crown, Lock
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  membership: string;
  currentMembership?: {
    _id: string;
    name: string;
    isDefault?: boolean;
    isTrial?: boolean;
  };
  streak?: {
    current: number;
    longest: number;
    lastWorkoutDate?: string;
  };
  progress?: {
    totalWorkouts: number;
    totalExerciseTime: number;
    totalDuration: number;
    workoutsThisWeek: number;
    workoutsThisMonth: number;
  };
}

interface WorkoutLog {
  _id: string;
  muscleGroup: {
    _id: string;
    name: string;
  };
  startTime: string;
  endTime?: string;
  exercisesCompleted: string[];
  duration?: number;
  totalExerciseTime?: number;
}

interface ClientProgressProps {
  user: User;
}

export function ClientProgress({ user }: ClientProgressProps) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null); // null = loading
  const [apiError, setApiError] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // 🔍 Verifica si el usuario tiene al menos un pago completado
  const hasCompletedPayment = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payments/my-payments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) return false;

      const data = await res.json();
      const payments = Array.isArray(data) ? data : data.payments || [];
      return payments.some((payment: any) => payment.status === 'COMPLETADO');
    } catch (err) {
      console.error('Error checking payments:', err);
      return false;
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || data;
        setUserData(userObj);
        return userObj;
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
    setUserData(user);
    return user;
  };

  const fetchWorkoutLogs = async () => {
    try {
      setApiError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/workout-logs/history`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const logs = Array.isArray(data.workouts) ? data.workouts : [];
        logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setWorkoutLogs(logs);
      } else {
        throw new Error('Failed to load workouts');
      }
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setApiError('No se pudieron cargar tus entrenamientos.');
      setWorkoutLogs([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchUserData(), fetchWorkoutLogs()]);
      setLoading(false);
      const access = await hasCompletedPayment();
      setHasAccess(access);
    };
    load();
  }, []);

  // 🔄 Esperando verificar acceso
  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-amber-500">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // 🔒 Sin pagos completados → solo mensaje estático
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="max-w-md w-full bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-2xl p-8 border border-amber-700/30 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Crown className="w-14 h-14 text-amber-500 opacity-80" />
              <Lock className="w-7 h-7 text-amber-300 absolute -bottom-1 -right-1 opacity-90" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-amber-100 mb-3">
            Progreso no disponible 🌻
          </h1>

          <p className="text-amber-200 leading-relaxed">
            El panel de progreso avanzado está reservado para usuarios con membresía activa.
            Visita la sección de <span className="font-semibold">"Membresías"</span> para activar tu plan y desbloquear esta funcionalidad.
          </p>

          <div className="mt-6 text-amber-400 text-sm italic">
            💡 Consejo: Completa una compra para acceder a estadísticas, gráficos y seguimiento detallado.
          </div>
        </div>
      </div>
    );
  }

  // 📊 CONTINUAR CON LA VISTA NORMAL (solo si tiene acceso)
  const currentUser = userData || user;
  const userStats = currentUser.progress || {
    totalWorkouts: 0,
    totalExerciseTime: 0,
    totalDuration: 0,
    workoutsThisWeek: 0,
    workoutsThisMonth: 0
  };
  const streakStats = currentUser.streak || {
    current: 0,
    longest: 0,
    lastWorkoutDate: ''
  };

  const prepareWeeklyChartData = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
      const dateFormatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      weekData.push({
        day: dayName,
        date: dateFormatted,
        fullDate: date.toISOString().split('T')[0],
        duration: 0,
        workouts: 0
      });
    }

    workoutLogs.forEach(log => {
      if (log.startTime) {
        const workoutDate = new Date(log.startTime);
        const workoutDay = workoutDate.toISOString().split('T')[0];
        const dayData = weekData.find(d => d.fullDate === workoutDay);
        if (dayData) {
          dayData.duration += log.duration || 0;
          dayData.workouts += 1;
        }
      }
    });

    return weekData;
  };

  const prepareMuscleGroupData = () => {
    if (!workoutLogs.length) return [];
    const groups: Record<string, number> = {};
    workoutLogs.forEach(log => {
      const name = log.muscleGroup?.name || 'General';
      groups[name] = (groups[name] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'Pecho': '#F59E0B',
      'Espalda': '#D97706',
      'Piernas': '#B45309',
      'Hombros': '#FBBF24',
      'Brazos': '#FCD34D',
      'Core': '#FDE68A',
      'Abdomen': '#92400E',
      'Glúteos': '#78350F',
      'Full Body': '#FEF3C7',
      'General': '#D97706'
    };

    return Object.entries(groups).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#D97706'
    }));
  };

  const weeklyData = prepareWeeklyChartData();
  const muscleData = prepareMuscleGroupData();
  const totalMinutes = userStats.totalDuration || 0;

  const getBarColor = (duration: number) => {
    if (duration >= 60) return '#065F46';
    if (duration >= 30) return '#D97706';
    if (duration >= 15) return '#F59E0B';
    return '#FBBF24';
  };

  const CompactWorkoutItem = ({ log }: { log: WorkoutLog }) => {
    const date = new Date(log.startTime);
    const duration = log.duration || 0;
    return (
      <div className="flex items-center justify-between p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
            <Dumbbell className="w-3 h-3" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-100 text-sm">{log.muscleGroup?.name || 'Entrenamiento'}</h3>
            <p className="text-amber-400 text-xs">
              {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-amber-200">
            {duration}<span className="text-xs text-amber-400">min</span>
          </div>
          <div className="text-xs text-amber-400">{log.exercisesCompleted?.length || 0} ej.</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-amber-500">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 text-amber-100 min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-900/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tu Progreso - {currentUser.name} 🌻</h1>
            <p className="text-amber-300 mt-1">📊 Basado en {userStats.totalWorkouts} entrenamientos reales</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-gradient-to-br from-amber-700 to-orange-800 p-4 rounded-xl text-amber-100">
              <div className="flex items-center gap-2 justify-center">
                <Flame className="w-5 h-5" />
                <span className="font-bold text-xl">{streakStats.current}</span>
              </div>
              <p className="text-amber-200 text-xs mt-1">Racha Actual</p>
            </div>
            <div className="text-center bg-gradient-to-br from-blue-700 to-purple-800 p-4 rounded-xl text-amber-100">
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="w-5 h-5" />
                <span className="font-bold text-xl">{streakStats.longest}</span>
              </div>
              <p className="text-blue-200 text-xs mt-1">Récord Personal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semanal */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-900/30">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Actividad de la Semana</h2>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#FBBF24' }} 
                  axisLine={{ stroke: '#374151' }} 
                  tickLine={{ stroke: '#374151' }} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#FBBF24' }} 
                  axisLine={{ stroke: '#374151' }} 
                  tickLine={{ stroke: '#374151' }} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(55, 65, 81, 0.5)' }}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #D97706', 
                    borderRadius: '8px',
                    color: '#FDE68A'
                  }}
                  formatter={(value, name) => {
                    if (name === 'duration') return [`${value} minutos`, 'Duración'];
                    return [value, name];
                  }}
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload) {
                      const d = payload[0].payload;
                      return `${d.day} ${d.date}`;
                    }
                    return '';
                  }}
                />
                <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.duration)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grupos musculares */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-900/30">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Grupos Musculares</h2>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            {muscleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.1 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                    outerRadius={80}
                    dataKey="value"
                    fill="#8884d8"
                  >
                    {muscleData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #D97706', 
                      borderRadius: '8px',
                      color: '#FDE68A'
                    }}
                    formatter={(value) => [`${value} entrenamientos`, '']} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-amber-400">
                <p>No hay datos de grupos musculares</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-900/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Historial Reciente</h2>
          </div>
          <span className="text-sm text-amber-400">Total: {workoutLogs.length} entrenamientos</span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {workoutLogs.length > 0 ? (
            workoutLogs.slice(0, 10).map(log => <CompactWorkoutItem key={log._id} log={log} />)
          ) : (
            <div className="text-center py-6 text-amber-400">No hay entrenamientos registrados</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientProgress;