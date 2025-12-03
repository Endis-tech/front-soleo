import { useState, useEffect } from 'react';
import ClientLayout from './components/ClientLayout';
import { ClientMainDashboard } from './components/ClientMainDashboard';
import { ClientHoy } from './components/ClientHoy';
import { ClientProgress } from './components/ClientProgress';
import { ClientProfile } from './components/ClientProfile';
import ClientMembership from './components/ClientMembership';
import ClientSettings from './components/ClientSettings'; // ✅ Sin props
import { api } from '../../api';

// Tipos disponibles para la vista del cliente
type ClientView = 'dashboard' | 'hoy' | 'membresias' | 'progreso' | 'perfil' | 'ajustes';

// Interfaces actualizadas
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    currentMembership?: string;
    membershipExpiresAt?: string;
    membershipAssignedAt?: string;
    profilePhoto?: string;
    createdAt: string;
    weight?: number;
    exerciseTime?: string;
}

interface CurrentMembershipInfo {
    membership: {
        _id: string;
        name: string;
        description: string;
        price: number;
        durationDays: number;
        isTrial: boolean;
        routine: string;
        status: string;
    } | null;
    expiresAt: string | null;
    assignedAt: string | null;
    isActive: boolean;
    daysRemaining: number;
    isExpired: boolean;
}

export function ClienteDashboard() {
    // const [activeView, setActiveView] = useState<'dashboard' | 'hoy' | 'membresias' | 'progreso' | 'perfil' | 'ajustes'>('dashboard');
    const [activeView, setActiveView] = useState<ClientView>("dashboard");
    const [user, setUser] = useState<User | null>(null);
    const [currentMembership, setCurrentMembership] = useState<CurrentMembershipInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                setLoading(true);
                setError(null);

                const userData = localStorage.getItem('user');
                if (!userData) {
                    throw new Error('No se encontraron datos de usuario');
                }

                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                try {
                    const membershipResponse = await api.get('/memberships/my/current');
                    if (membershipResponse.data.success) {
                        setCurrentMembership(membershipResponse.data.data);
                        
                        const updatedUser = {
                            ...parsedUser,
                            currentMembership: membershipResponse.data.data.membership?._id,
                            membershipExpiresAt: membershipResponse.data.data.expiresAt,
                            membershipAssignedAt: membershipResponse.data.data.assignedAt
                        };
                        
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                    }
                } catch (membershipError: any) {
                    console.log('⚠️ No se pudo cargar información de membresía:', membershipError.message);
                }

            } catch (error: any) {
                console.error('❌ Error cargando datos del usuario:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    const getDisplayMembership = () => {
        if (currentMembership?.membership) {
            return currentMembership.membership.name;
        }
        if (user?.currentMembership) {
            return "Cargando...";
        }
        return "Semilla";
    };

    const getMembershipStatus = () => {
        if (currentMembership) {
            return currentMembership.isActive ? 'Activa' : 'Inactiva';
        }
        return 'Sin información';
    };

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-amber-500">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p>Cargando información del usuario...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center max-w-md p-6 bg-gray-900 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-red-400 mb-4">
                        {error || 'Error cargando datos del usuario'}
                    </h2>
                    
                    <div className="text-left bg-amber-900/10 p-4 rounded mb-4 border border-amber-800/30">
                        <p className="text-sm text-amber-300 mb-2">Información de debug:</p>
                        <p className="text-sm">Token: {localStorage.getItem('token') ? '✅ Presente' : '❌ Ausente'}</p>
                        <p className="text-sm">User Role: {localStorage.getItem('userRole') || 'No encontrado'}</p>
                        <p className="text-sm">User Data: {localStorage.getItem('user') ? '✅ Presente' : '❌ Ausente'}</p>
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => window.location.href = '/login'}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:from-amber-700 hover:to-orange-700 transition-colors"
                        >
                            Volver al Login
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full border border-amber-700 text-amber-200 px-6 py-3 rounded-lg font-bold hover:bg-amber-900/20 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderActiveView = () => {
        const userWithMembership = {
            ...user,
            membership: getDisplayMembership(),
            currentMembershipInfo: currentMembership
        };

        switch(activeView) {
            case 'dashboard':
                return (
                    <ClientMainDashboard 
                    userName={user.name} 
                    userMembership={getDisplayMembership()}
                    membershipStatus={getMembershipStatus()}
                    daysRemaining={currentMembership?.daysRemaining || 0}
                    isActive={currentMembership?.isActive || false}
                    onNavigate={(view: ClientView) => setActiveView(view)} // ✅
                    />
                );
            case 'hoy':
                return <ClientHoy user={userWithMembership} />;
            case 'membresias':
                return <ClientMembership user={userWithMembership} />;
            case 'progreso':
                return <ClientProgress user={userWithMembership} />;
            case 'perfil':
                return <ClientProfile user={userWithMembership} />;
            case 'ajustes':
                return <ClientSettings />; // ✅ CORREGIDO: sin props
            default:
                return (
                    <ClientMainDashboard 
                        userName={user.name} 
                        userMembership={getDisplayMembership()}
                        membershipStatus={getMembershipStatus()}
                        daysRemaining={currentMembership?.daysRemaining || 0}
                        isActive={currentMembership?.isActive || false}
                        onNavigate={(view: ClientView) => setActiveView(view)} // ✅
                    />
                );
        }
    };

    return (
        <ClientLayout
            user={{
                ...user,
                membership: getDisplayMembership()
            }}
            activeView={activeView}
            onViewChange={(view: ClientView) => setActiveView(view)} // ✅
            onLogout={logout}
            membershipInfo={currentMembership}
        >
            {renderActiveView()}
        </ClientLayout>
    );
}