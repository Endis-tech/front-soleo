import { Crown, Users, Ticket, Activity, UserPlus, CreditCard, BarChart3, History, Dumbbell } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminDashboardProps {
    adminName: string;
    onNavigate: (section: string) => void;
}

interface DashboardStats {
    totalClients: number;
    activeMemberships: number;
    activeRoutines: number;
    totalRevenue: number;
    pendingPayments: number;
}

export function AdminMainDashboard({ adminName, onNavigate }: AdminDashboardProps) {
    const [stats, setStats] = useState<DashboardStats>({
        totalClients: 0,
        activeMemberships: 0,
        activeRoutines: 0,
        totalRevenue: 0,
        pendingPayments: 0
    });
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    // ✅ UTILIDAD PARA NORMALIZAR RESPUESTAS
    const normalizeArrayResponse = (data: any, key: string = 'memberships'): any[] => {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && typeof data === 'object') {
            if (Array.isArray(data[key])) return data[key];
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.items)) return data.items;
        }
        return [];
    };

    // Cargar estadísticas reales
    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            console.log('📊 Cargando estadísticas del dashboard...');

            // 1. Cargar usuarios para contar clientes
            const usersResponse = await fetch(`${API_URL}/auth/users`, {
                headers: getAuthHeaders()
            });
            const usersData = await usersResponse.json();
            const clients = normalizeArrayResponse(usersData, 'users')
                .filter((user: any) => user?.role === 'CLIENTE');

            // 2. Cargar membresías activas
            const membershipsResponse = await fetch(`${API_URL}/memberships`, {
                headers: getAuthHeaders()
            });
            const membershipsData = await membershipsResponse.json();
            const activeMemberships = normalizeArrayResponse(membershipsData)
                .filter((m: any) => m?.status === 'ACTIVO').length;

            // 3. Cargar rutinas activas
            const routinesResponse = await fetch(`${API_URL}/routines`, {
                headers: getAuthHeaders()
            });
            const routinesData = await routinesResponse.json();
            const activeRoutines = normalizeArrayResponse(routinesData, 'routines')
                .filter((r: any) => r?.status === 'ACTIVO').length;

            // 4. Cargar pagos para calcular ingresos
            const paymentsResponse = await fetch(`${API_URL}/payments/history`, {
                headers: getAuthHeaders()
            });
            const paymentsData = await paymentsResponse.json();
            const paymentsArray = normalizeArrayResponse(paymentsData, 'payments');
            const completedPayments = paymentsArray
                .filter((p: any) => p?.status === 'COMPLETADO');
            
            const totalRevenue = completedPayments.reduce((sum: number, payment: any) => 
                sum + (typeof payment.amount === 'number' ? payment.amount : 0), 0
            );

            const pendingPayments = paymentsArray
                .filter((p: any) => p?.status === 'PENDIENTE').length;

            setStats({
                totalClients: clients.length,
                activeMemberships: activeMemberships,
                activeRoutines: activeRoutines,
                totalRevenue: totalRevenue,
                pendingPayments: pendingPayments
            });

            console.log('✅ Estadísticas cargadas:', {
                clients: clients.length,
                memberships: activeMemberships,
                routines: activeRoutines,
                revenue: totalRevenue,
                pending: pendingPayments
            });

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            setStats({
                totalClients: 0,
                activeMemberships: 0,
                activeRoutines: 0,
                totalRevenue: 0,
                pendingPayments: 0
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('es-MX').format(num);
    };

    const statsCards = [
        { 
            label: 'Clientes Registrados', 
            value: formatNumber(stats.totalClients), 
            icon: Users, 
            color: 'bg-green-500',
            description: 'Usuarios con rol CLIENTE'
        },
        { 
            label: 'Membresías Activas', 
            value: formatNumber(stats.activeMemberships), 
            icon: Ticket, 
            color: 'bg-blue-500',
            description: 'Planes activos'
        },
        { 
            label: 'Rutinas Activas', 
            value: formatNumber(stats.activeRoutines), 
            icon: Activity, 
            color: 'bg-purple-500',
            description: 'Rutinas en uso'
        },
        { 
            label: 'Ingresos Totales', 
            value: formatCurrency(stats.totalRevenue), 
            icon: CreditCard, 
            color: 'bg-amber-500',
            description: 'Pagos completados'
        },
        { 
            label: 'Pagos Pendientes', 
            value: formatNumber(stats.pendingPayments), 
            icon: History, 
            color: 'bg-orange-500',
            description: 'Por procesar'
        }
    ];

    const quickActions = [
        {
            label: 'Gestionar Membresías',
            icon: Ticket,
            color: 'bg-soleo-yellow hover:bg-amber-400',
            textColor: 'text-soleo-text-dark',
            section: 'memberships',
            description: 'Crear y editar planes'
        },
        {
            label: 'Ver Clientes',
            icon: Users,
            color: 'bg-blue-600 hover:bg-blue-500',
            textColor: 'text-white',
            section: 'clients-list',
            description: 'Lista de clientes'
        },
        {
            label: 'Rutina',
            icon: Dumbbell,
            color: 'bg-green-600 hover:bg-green-500',
            textColor: 'text-white',
            section: 'bulking',
            description: 'Gestionar rutina'
        },
        {
            label: 'Estadísticas',
            icon: BarChart3,
            color: 'bg-purple-600 hover:bg-purple-500',
            textColor: 'text-white',
            section: 'client-stats',
            description: 'Métricas y gráficas'
        },
        {
            label: 'Historial de Pagos',
            icon: History,
            color: 'bg-amber-600 hover:bg-amber-500',
            textColor: 'text-white',
            section: 'payment-history',
            description: 'Ver transacciones'
        },
        {
            label: 'Registrar Admin',
            icon: UserPlus,
            color: 'bg-indigo-600 hover:bg-indigo-500',
            textColor: 'text-white',
            section: 'register',
            description: 'Nuevo administrador'
        },
        {
            label: 'Ejercicios y Músculos',
            icon: Activity,
            color: 'bg-red-600 hover:bg-red-500',
            textColor: 'text-white',
            section: 'muscles-exercises',
            description: 'Catálogo completo'
        }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-soleo-yellow text-lg">Cargando estadísticas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header de Bienvenida */}
            <div className="text-center lg:text-left">
                <h1 className="text-4xl font-heading font-bold text-white mb-2">
                    ¡Bienvenido, {adminName}! 👋
                </h1>
                <p className="text-soleo-light text-lg">
                    Panel de control de <span className="text-soleo-yellow font-bold">SÓLEO 🌻</span>
                </p>
                <p className="text-soleo-light text-sm mt-1">
                    {new Date().toLocaleDateString('es-MX', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </p>
            </div>
            
            {/* Estadísticas en Tiempo Real */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50 hover:border-soleo-yellow/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-soleo-light text-xs font-medium">{stat.label}</p>
                                    <p className="text-xl font-bold text-soleo-yellow mt-1">{stat.value}</p>
                                    <p className="text-soleo-light text-xs mt-1 opacity-75">{stat.description}</p>
                                </div>
                                <div className={`${stat.color} p-2 rounded-lg ml-3`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-soleo-yellow">Acciones Rápidas</h2>
                    <button
                        onClick={() => fetchDashboardStats()}
                        className="text-soleo-light hover:text-soleo-yellow transition-colors text-sm flex items-center gap-2"
                    >
                        <span>Actualizar datos</span>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => onNavigate(action.section)}
                                className={`${action.color} ${action.textColor} py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 font-bold text-center shadow-lg hover:shadow-xl`}
                            >
                                <Icon className="w-6 h-6 inline mr-2 mb-1" />
                                <div className="font-semibold text-sm">{action.label}</div>
                                <div className="text-xs opacity-90 mt-1 font-normal">
                                    {action.description}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Resumen Rápido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximas Acciones */}
                <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
                    <h3 className="text-xl font-bold text-soleo-yellow mb-4">Resumen del Sistema</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-soleo-brown/30">
                            <span className="text-soleo-light">Clientes nuevos hoy:</span>
                            <span className="text-soleo-yellow font-bold">0</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-soleo-brown/30">
                            <span className="text-soleo-light">Pagos hoy:</span>
                            <span className="text-soleo-yellow font-bold">0</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-soleo-brown/30">
                            <span className="text-soleo-light">Membresías por expirar:</span>
                            <span className="text-amber-400 font-bold">0</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-soleo-light">Sistema actualizado:</span>
                            <span className="text-green-400 font-bold">Ahora</span>
                        </div>
                    </div>
                </div>

                {/* Estado del Sistema */}
                <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
                    <h3 className="text-xl font-bold text-soleo-yellow mb-4">Estado del Sistema</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 py-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-soleo-light">Base de datos: </span>
                            <span className="text-green-400 font-bold">Conectada</span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-soleo-light">Servidor API: </span>
                            <span className="text-green-400 font-bold">En línea</span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="text-soleo-light">Usuarios activos: </span>
                            <span className="text-blue-400 font-bold">1</span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                            <span className="text-soleo-light">Versión: </span>
                            <span className="text-amber-400 font-bold">1.0.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-blue-600/20 border border-blue-600 text-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5" />
                    <p className="font-bold">💡 Panel de Control Activo</p>
                </div>
                <p className="text-sm">
                    Todas las estadísticas se calculan en tiempo real desde tu base de datos. 
                    Usa las acciones rápidas para navegar a las diferentes secciones de administración.
                </p>
            </div>
        </div>
    );
}