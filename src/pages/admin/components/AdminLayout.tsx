// src/components/AdminLayout.tsx
import { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    CreditCard, 
    Users, 
    History, 
    BarChart3, 
    UserPlus,
    Dumbbell,
    Activity, 
    LogOut,
    Menu,
    X,
    Wifi,
    WifiOff
} from 'lucide-react';

interface AdminLayoutProps {
    admin: { name: string } | null;
    loadingAdmin: boolean;
    activeSection: string;
    onSectionChange: (section: string) => void;
    onLogout: () => void;
    children: React.ReactNode;
}

export function AdminLayout({ 
    admin, 
    loadingAdmin, 
    activeSection, 
    onSectionChange, 
    onLogout, 
    children 
}: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'memberships', label: 'Membresías', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'clients-list', label: 'Lista de Clientes', icon: <Users className="w-5 h-5" /> },
        { id: 'muscles-exercises', label: 'Músculos y Ejercicios', icon: <Dumbbell className="w-5 h-5" /> },
        { id: 'bulking', label: 'Rutina', icon: <Activity className="w-5 h-5" /> },
        { id: 'payment-history', label: 'Historial de Pagos', icon: <History className="w-5 h-5" /> },
        { id: 'client-stats', label: 'Estadísticas', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'register', label: 'Registrar Admin', icon: <UserPlus className="w-5 h-5" /> }
    ];

    const bgColor = 'bg-black';
    const sidebarBg = 'bg-black';
    const borderColor = 'border-gray-800';
    const textColor = 'text-gray-300';
    const textPrimary = 'text-white';
    const hoverBg = 'hover:bg-gray-900';
    const activeBg = 'bg-gray-900';
    const accentColor = 'text-yellow-400';

    // Estilo del indicador
    const connectionIndicatorClass = `flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border ${
        isOnline 
            ? 'bg-green-900/60 text-green-200 border-green-700' 
            : 'bg-red-900/60 text-red-200 border-red-700'
    }`;

    return (
        <div className={`flex h-screen ${bgColor} ${textPrimary}`}>
            {/* Sidebar desktop */}
            <div className={`hidden md:flex md:w-64 md:flex-col ${sidebarBg} ${borderColor} border-r`}>
                <div className="flex flex-col flex-1">
                    <div className={`flex items-center justify-center h-16 px-4 border-b ${borderColor}`}>
                        <div className="text-2xl font-bold text-yellow-400">
                            SÓLEO🌻
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSectionChange(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                    activeSection === item.id
                                        ? `${activeBg} ${accentColor} font-bold`
                                        : `${textColor} ${hoverBg}`
                                }`}
                            >
                                <span className={activeSection === item.id ? accentColor : 'text-gray-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Footer desktop — con indicador de conexión */}
                    <div className={`p-4 border-t ${borderColor}`}>
                        {loadingAdmin ? (
                            <div className="text-gray-500">Cargando...</div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {admin?.name || 'Administrador'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        Administrador
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* 🔌 Indicador de conexión */}
                                    <div className={connectionIndicatorClass}>
                                        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">Online</span>
                                    </div>

                                    {/* Botón de logout */}
                                    <button
                                        onClick={onLogout}
                                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                        title="Cerrar sesión"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header móvil — con indicador */}
                <header className={`md:hidden ${sidebarBg} ${borderColor} border-b p-4`}>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-gray-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="text-xl font-bold text-yellow-400">
                            SÓLEO 🌻
                        </div>
                        <div className="flex items-center gap-2">
                            {/* 🔌 Indicador en móvil */}
                            <div className={connectionIndicatorClass}>
                                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-2 text-gray-400 hover:text-red-400"
                                title="Cerrar sesión"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Sidebar móvil */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div 
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className={`absolute inset-y-0 left-0 w-64 ${sidebarBg} ${borderColor} border-r`}>
                            <div className="flex flex-col h-full">
                                <div className={`flex items-center justify-between h-16 px-4 border-b ${borderColor}`}>
                                    <div className="text-xl font-bold text-yellow-400">
                                        SOLEO 🌻
                                    </div>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-2 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <nav className="flex-1 px-4 py-6 space-y-2">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                onSectionChange(item.id);
                                                setSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                                activeSection === item.id
                                                    ? `${activeBg} ${accentColor} font-bold`
                                                    : `${textColor} ${hoverBg}`
                                            }`}
                                        >
                                            <span className={activeSection === item.id ? accentColor : 'text-gray-400'}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>

                                {/* Footer móvil — con indicador */}
                                <div className={`p-4 border-t ${borderColor}`}>
                                    {loadingAdmin ? (
                                        <div className="text-gray-500">Cargando...</div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {admin?.name || 'Administrador'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Administrador
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={connectionIndicatorClass}>
                                                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        onLogout();
                                                        setSidebarOpen(false);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-red-400"
                                                    title="Cerrar sesión"
                                                >
                                                    <LogOut className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <main className={`flex-1 overflow-auto ${bgColor}`}>
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;