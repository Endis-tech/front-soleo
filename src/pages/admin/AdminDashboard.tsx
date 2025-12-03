import { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { AdminMainDashboard } from './components/AdminMainDashboard';
import { AdminMemberships } from './components/AdminMemberships';
import { AdminClientsList } from './components/AdminClientsList';
import { AdminBulking } from './components/AdminBulking';
import { AdminMusclesExercises } from './components/AdminMusclesExercises';
import { AdminPaymentHistory } from './components/AdminPaymentHistory';
import { AdminClientStats } from './components/AdminClientStats';
import { AdminRegister } from './components/AdminRegister';

// ✅ INICIALIZAR SINCRONIZACIÓN OFFLINE
import { initSync } from "../../offline/sync";

interface AdminData {
    name: string;
}

interface MembershipData {
    _id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    status: "ACTIVO" | "INACTIVO";
    isDefault: boolean;
    routine?: any;
    createdAt: string;
    updatedAt: string;
}

export function AdminDashboard() {
    const [admin, setAdmin] = useState<AdminData | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    
    // ✅ AÑADIMOS estado para error/success (solo para satisfacer las props requeridas)
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [memberships, setMemberships] = useState<MembershipData[]>([]);
    const [loadingMemberships, setLoadingMemberships] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    // ✅ Inicializar sincronización offline al montar
    useEffect(() => {
        initSync();
    }, []);

    // Fetch Admin Profile
    useEffect(() => {
        const fetchAdmin = async () => {
            setLoadingAdmin(true);
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.user && data.user.name) {
                    setAdmin({ name: data.user.name });
                } else {
                    setAdmin({ name: 'Administrador' });
                }
            } catch (error) {
                console.error('❌ Error fetching admin:', error);
                setAdmin({ name: 'Administrador' });
            } finally {
                setLoadingAdmin(false);
            }
        };
        fetchAdmin();
    }, [API_URL]);

    // Fetch Membresías
    const fetchMemberships = async () => {
        setLoadingMemberships(true);
        try {
            const response = await fetch(`${API_URL}/memberships`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Error al cargar membresías');
            }

            const data = await response.json();
            const membershipsList = Array.isArray(data) 
                ? data 
                : (data.memberships || data.data || []);
            
            setMemberships(membershipsList);
        } catch (error) {
            console.error('Error fetching memberships:', error);
        } finally {
            setLoadingMemberships(false);
        }
    };

    // Cargar membresías cuando se active la sección
    useEffect(() => {
        if (activeSection === 'memberships') {
            fetchMemberships();
        }
    }, [activeSection]);

    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <AdminMainDashboard 
                        adminName={admin?.name || 'Administrador'} 
                        onNavigate={setActiveSection}
                    />
                );
            case 'memberships':
                return (
                    <AdminMemberships 
                        memberships={memberships}
                        loadingMemberships={loadingMemberships}
                        onFetchMemberships={fetchMemberships}
                    />
                );
            case 'clients-list':
                return <AdminClientsList />;
            case 'payment-history':
                // ✅ CORREGIDO: Eliminada onSetSuccess
                return (
                    <AdminPaymentHistory 
                        error={error}
                        success={success}
                        onSetError={setError}
                        // onSetSuccess={setSuccess} // ❌ Eliminada
                    />
                );
            case 'client-stats':
                // ✅ PASAMOS LAS PROPS REQUERIDAS (asumiendo que AdminClientStats SÍ tiene onSetSuccess)
                return (
                    <AdminClientStats 
                        error={error}
                        success={success}
                        onSetError={setError}
                        onSetSuccess={setSuccess}
                    />
                );
            case 'bulking':
                return <AdminBulking />;
            case 'muscles-exercises':
                return <AdminMusclesExercises />;
            case 'register':
                return <AdminRegister />;
            default:
                return (
                    <AdminMainDashboard 
                        adminName={admin?.name || 'Administrador'} 
                        onNavigate={setActiveSection}
                    />
                );
        }
    };

    return (
        <AdminLayout
            admin={admin}
            loadingAdmin={loadingAdmin}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onLogout={logout}
        >
            {renderContent()}
        </AdminLayout>
    );
}

export default AdminDashboard;