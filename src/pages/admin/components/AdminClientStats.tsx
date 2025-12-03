import { useState, useEffect } from 'react';
import { Users, CreditCard, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Title 
} from 'chart.js';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Title
);

interface AdminClientStatsProps {
  error: string | null;
  success: string | null;
  onSetError: (error: string | null) => void;
  onSetSuccess: (success: string | null) => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  membership?: string;
}

interface Payment {
  _id: string;
  user: string;
  userName?: string;
  amount: number;
  status: string;
  createdAt: string;
  membershipType?: string;
}

export function AdminClientStats({ error, success, onSetError, onSetSuccess }: AdminClientStatsProps) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;
  const USERS_CACHE_KEY = 'adminStatsUsers';
  const PAYMENTS_CACHE_KEY = 'adminStatsPayments';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // ✅ Cargar desde caché
  const loadFromCache = () => {
    try {
      const cachedUsers = localStorage.getItem(USERS_CACHE_KEY);
      const cachedPayments = localStorage.getItem(PAYMENTS_CACHE_KEY);
      if (cachedUsers) setUsers(JSON.parse(cachedUsers));
      if (cachedPayments) setPayments(JSON.parse(cachedPayments));
    } catch (e) {
      console.warn('Error loading stats cache');
    }
  };

  // CARGAR DATOS REALES
  const fetchRealData = async () => {
    setLoading(true);
    onSetError(null);
    
    try {
      // 1. Cargar usuarios
      const usersResponse = await fetch(`${API_URL}/auth/users`, {
        headers: getAuthHeaders()
      });
      if (!usersResponse.ok) throw new Error('Error al cargar usuarios');
      const usersData = await usersResponse.json();
      const usersList = usersData.users || usersData || [];
      setUsers(usersList);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(usersList)); // ✅ Guardar en caché

      // 2. Cargar pagos
      const paymentsResponse = await fetch(`${API_URL}/payments/history`, {
        headers: getAuthHeaders()
      });
      if (!paymentsResponse.ok) throw new Error('Error al cargar pagos');
      const paymentsData = await paymentsResponse.json();
      const paymentsList = paymentsData.payments || paymentsData || [];
      setPayments(paymentsList);
      localStorage.setItem(PAYMENTS_CACHE_KEY, JSON.stringify(paymentsList)); // ✅ Guardar en caché

      onSetSuccess(`Datos cargados: ${usersList.length} usuarios, ${paymentsList.length} pagos`);

    } catch (error) {
      console.error('Error cargando datos reales:', error);
      onSetError('No se pudieron cargar los datos completos');
      
      // ✅ Si falla y estamos offline, usar caché
      if (!navigator.onLine) {
        loadFromCache();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.onLine) {
      // ✅ Cargar desde caché al inicio si estamos offline
      loadFromCache();
      setLoading(false);
    } else {
      fetchRealData();
    }
  }, []);

  // RESTO DE TU LÓGICA (calculateStats, gráficas, etc.) SE MANTIENE IGUAL

  const calculateStats = () => {
    const clients = users.filter(user => user.role === 'CLIENTE');
    const totalClients = clients.length;

    const completedPayments = payments.filter(payment => 
      payment.status === 'COMPLETADO' || payment.status === 'completed'
    );

    const clientsWithPayments = new Set(
      completedPayments.map(payment => payment.user)
    ).size;

    const totalRevenue = completedPayments.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const clientsThisMonth = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
    }).length;

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('es-MX', { month: 'short' });
    }).reverse();

    const monthlySales = last6Months.map((_, index) => {
      const targetMonth = new Date().getMonth() - (5 - index);
      const targetYear = new Date().getFullYear();
      
      return completedPayments
        .filter(payment => {
          const paymentDate = new Date(payment.createdAt);
          return paymentDate.getMonth() === targetMonth && paymentDate.getFullYear() === targetYear;
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    });

    return {
      totalClients,
      clientsWithPayments,
      totalRevenue,
      clientsThisMonth,
      monthlySales,
      last6Months,
      conversionRate: totalClients > 0 ? Math.round((clientsWithPayments / totalClients) * 100) : 0,
      averageRevenue: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0
    };
  };

  const stats = calculateStats();

  const clientDistributionData = {
    labels: ['Con pagos', 'Sin pagos'],
    datasets: [
      {
        data: [stats.clientsWithPayments, stats.totalClients - stats.clientsWithPayments],
        backgroundColor: ['#10B981', '#6B7280'],
        borderColor: ['#10B981', '#6B7280'],
        borderWidth: 2,
      },
    ],
  };

  const monthlySalesData = {
    labels: stats.last6Months,
    datasets: [
      {
        label: 'Ventas Mensuales ($)',
        data: stats.monthlySales,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const paymentStatusData = {
    labels: ['Completados', 'Pendientes', 'Cancelados'],
    datasets: [
      {
        data: [
          payments.filter(p => p.status === 'COMPLETADO' || p.status === 'completed').length,
          payments.filter(p => p.status === 'PENDIENTE' || p.status === 'pending').length,
          payments.filter(p => p.status === 'CANCELADO' || p.status === 'cancelled').length
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#E5E7EB',
          font: { size: 12 }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#FBBF24',
        bodyColor: '#E5E7EB',
        borderColor: '#F59E0B',
        borderWidth: 1,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: {
          color: '#E5E7EB',
          callback: function(value: any) {
            return '$' + value.toLocaleString('es-MX');
          }
        },
      },
      x: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: { color: '#E5E7EB' },
      },
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-soleo-yellow text-lg">Cargando estadísticas reales...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white">Estadísticas en Tiempo Real</h1>
          <p className="text-soleo-light mt-2">
            Datos reales de clientes y pagos - {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>
        
        <button
          onClick={fetchRealData}
          className="bg-soleo-yellow text-soleo-text-dark py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-600 text-white p-4 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-600/20 border border-green-600 text-white p-4 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-soleo-light text-sm">Total Clientes</p>
              <p className="text-3xl font-bold text-white">{formatNumber(stats.totalClients)}</p>
              <p className="text-xs text-soleo-light mt-1">Role: CLIENTE</p>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-soleo-light text-sm">Clientes Activos</p>
              <p className="text-3xl font-bold text-white">{formatNumber(stats.clientsWithPayments)}</p>
              <p className="text-xs text-soleo-light mt-1">Con pagos completados</p>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-soleo-light text-sm">Tasa Conversión</p>
              <p className="text-3xl font-bold text-white">{stats.conversionRate}%</p>
              <p className="text-xs text-soleo-light mt-1">Cliente → Pago</p>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="text-soleo-light text-sm">Ingresos Totales</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-soleo-light mt-1">Histórico acumulado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <h3 className="text-xl font-bold text-soleo-yellow mb-4">Distribución de Clientes</h3>
          <div className="h-64">
            <Doughnut data={clientDistributionData} options={chartOptions} />
          </div>
          <div className="mt-4 text-center text-soleo-light text-sm">
            {stats.clientsWithPayments} de {stats.totalClients} clientes han realizado pagos
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <h3 className="text-xl font-bold text-soleo-yellow mb-4">Estado de Pagos</h3>
          <div className="h-64">
            <Doughnut data={paymentStatusData} options={chartOptions} />
          </div>
          <div className="mt-4 text-center text-soleo-light text-sm">
            Total pagos: {formatNumber(payments.length)}
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50 lg:col-span-2">
          <h3 className="text-xl font-bold text-soleo-yellow mb-4">Ventas Mensuales (Últimos 6 Meses)</h3>
          <div className="h-64">
            <Line data={monthlySalesData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <h3 className="text-xl font-bold text-soleo-yellow mb-4">Resumen Detallado</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Clientes registrados este mes:</span>
              <span className="text-white font-bold">{formatNumber(stats.clientsThisMonth)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Total de pagos procesados:</span>
              <span className="text-white font-bold">{formatNumber(payments.length)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Pagos completados:</span>
              <span className="text-green-400 font-bold">
                {formatNumber(payments.filter(p => p.status === 'COMPLETADO' || p.status === 'completed').length)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Ingreso promedio por pago:</span>
              <span className="text-soleo-yellow font-bold">{formatCurrency(stats.averageRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <h3 className="text-xl font-bold text-soleo-yellow mb-4">Rendimiento</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Eficiencia de conversión:</span>
              <span className={`font-bold ${stats.conversionRate >= 50 ? 'text-green-400' : stats.conversionRate >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                {stats.conversionRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Clientes potenciales:</span>
              <span className="text-white font-bold">
                {formatNumber(stats.totalClients - stats.clientsWithPayments)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-soleo-light">Tasa de crecimiento mensual:</span>
              <span className="text-green-400 font-bold">
                {stats.totalClients > 0 ? Math.round((stats.clientsThisMonth / stats.totalClients) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}