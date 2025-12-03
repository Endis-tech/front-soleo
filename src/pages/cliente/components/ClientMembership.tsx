// src/pages/cliente/components/ClientMembership.tsx
import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Zap, Crown, CheckCircle, AlertCircle, History } from 'lucide-react';
import { api } from '../../../api';

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

interface Membership {
    _id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    isTrial: boolean;
    routine: string;
    status: string;
}

interface Payment {
    _id: string;
    membership: Membership;
    amount: number;
    status: string;
    purchaseDate: string;
    expirationDate: string;
}

interface CurrentMembershipInfo {
    membership: Membership | null;
    expiresAt: string | null;
    assignedAt: string | null;
    isActive: boolean;
    daysRemaining: number;
    isExpired: boolean;
}

interface ClientMembershipProps {
    user: User;
}

const ClientMembership: React.FC<ClientMembershipProps> = ({ user }) => {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [currentMembership, setCurrentMembership] = useState<CurrentMembershipInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            const [membershipsRes, paymentsRes, currentMembershipRes] = await Promise.all([
                api.get('/memberships'),
                api.get('/payments/my-payments'),
                api.get('/memberships/my/current')
            ]);

            let membershipsData: Membership[] = [];
            if (Array.isArray(membershipsRes.data)) {
                membershipsData = membershipsRes.data;
            } else if (Array.isArray(membershipsRes.data.memberships)) {
                membershipsData = membershipsRes.data.memberships;
            } else if (Array.isArray(membershipsRes.data.data)) {
                membershipsData = membershipsRes.data.data;
            }

            const activeMemberships = membershipsData.filter((m: Membership) => 
                m.status === 'ACTIVO' && !m.isTrial
            );
            setMemberships(activeMemberships);

            let paymentsData: Payment[] = [];
            if (Array.isArray(paymentsRes.data)) {
                paymentsData = paymentsRes.data;
            } else if (Array.isArray(paymentsRes.data.payments)) {
                paymentsData = paymentsRes.data.payments;
            } else if (Array.isArray(paymentsRes.data.data)) {
                paymentsData = paymentsRes.data.data;
            }

            const sortedPayments = paymentsData.sort((a, b) => 
                new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
            );
            const lastPayment = sortedPayments.length > 0 ? [sortedPayments[0]] : [];
            setPayments(lastPayment);

            if (currentMembershipRes.data && currentMembershipRes.data.data) {
                setCurrentMembership(currentMembershipRes.data.data);
            }

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (membershipId: string) => {
        setProcessing(membershipId);
        try {
            const response = await api.post('/payments/create', { membershipId });
            if (response.data.success && response.data.approvalURL) {
                window.location.href = response.data.approvalURL;
            } else {
                throw new Error('No se pudo generar el enlace de pago');
            }
        } catch (error: any) {
            console.error('Error creando pago:', error);
            alert(error.response?.data?.message || 'Error al procesar la compra');
        } finally {
            setProcessing(null);
        }
    };

    const getDaysLeft = (expirationDate: string) => {
        const expires = new Date(expirationDate);
        const today = new Date();
        const diffTime = expires.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
            case 'COMPLETADO': 
                return 'bg-emerald-900/40 text-emerald-200 border border-emerald-800/50';
            case 'PENDING':
            case 'PENDIENTE': 
                return 'bg-amber-900/40 text-amber-200 border border-amber-800/50';
            case 'CANCELLED':
            case 'CANCELADO': 
                return 'bg-red-900/40 text-red-200 border border-red-800/50';
            default: 
                return 'bg-gray-800 text-gray-300 border border-gray-700';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12 min-h-screen bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 sm:p-6 text-amber-100 min-h-screen bg-black">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Membresías</h1>
                <p className="text-amber-300 mt-2">Mejora tu experiencia de entrenamiento</p>
            </div>

            {/* Membresía Actual */}
            <div className={`rounded-xl p-6 text-white ${
                currentMembership?.isActive 
                    ? 'bg-gradient-to-r from-amber-700 to-orange-800' 
                    : 'bg-gradient-to-r from-gray-700 to-gray-800'
            }`}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">
                            {currentMembership?.isActive ? 'Membresía Actual' : 'Sin Membresía Activa'}
                        </h2>
                        
                        {currentMembership?.membership ? (
                            <>
                                <p className="text-lg font-semibold mb-1">
                                    {currentMembership.membership.name}
                                </p>
                                <p className="opacity-90 text-sm">
                                    {currentMembership.isActive ? (
                                        `⏳ ${currentMembership.daysRemaining} días restantes`
                                    ) : (
                                        '❌ Expirada'
                                    )}
                                </p>
                                {currentMembership.expiresAt && (
                                    <p className="opacity-80 text-sm mt-1">
                                        Vence: {formatDate(currentMembership.expiresAt)}
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                <p>No tienes una membresía activa</p>
                            </div>
                        )}
                    </div>
                    <Crown className="w-10 h-10 sm:w-12 sm:h-12 opacity-80" />
                </div>
            </div>

            {/* Planes Disponibles */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-amber-400" />
                    Planes Disponibles
                </h3>
                
                {memberships.length === 0 ? (
                    <div className="text-center py-8 text-amber-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-700" />
                        <p>No hay planes disponibles en este momento</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {memberships.map((membership) => {
                            const isCurrentMembership = currentMembership?.membership?._id === membership._id;
                            const isActive = currentMembership?.isActive;
                            
                            return (
                                <div
                                    key={membership._id}
                                    className={`border-2 rounded-xl p-6 transition-all ${
                                        isCurrentMembership && isActive
                                            ? 'border-amber-500 bg-amber-900/20' 
                                            : 'border-amber-900/30 hover:border-amber-500 hover:bg-amber-900/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-amber-100">{membership.name}</h4>
                                        {isCurrentMembership && isActive && (
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        )}
                                    </div>
                                    
                                    <p className="text-amber-300 text-sm mb-4">{membership.description}</p>
                                    
                                    <div className="mb-4">
                                        <span className="text-2xl sm:text-3xl font-bold text-amber-400">
                                            {formatCurrency(membership.price)}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm text-amber-400 mb-4 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Duración:</span>
                                            <span className="font-medium">{membership.durationDays} días</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estado:</span>
                                            <span className="font-medium capitalize">{membership.status.toLowerCase()}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePurchase(membership._id)}
                                        disabled={processing === membership._id || (isCurrentMembership && isActive)}
                                        className={`w-full py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center ${
                                            isCurrentMembership && isActive
                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:opacity-90'
                                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        {processing === membership._id 
                                            ? 'Procesando...' 
                                            : isCurrentMembership && isActive 
                                                ? 'Plan Actual' 
                                                : 'Seleccionar Plan'
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ÚLTIMO PAGO */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                    <History className="w-5 h-5 mr-2 text-amber-400" />
                    Último Pago
                </h3>
                
                {payments.length === 0 ? (
                    <div className="text-center py-8 text-amber-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-amber-700" />
                        <p>No hay pagos registrados</p>
                        <p className="text-sm text-amber-500 mt-2">
                            Realiza tu primera compra para verla aquí
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <div key={payment._id} className="border border-amber-900/30 rounded-lg p-6 bg-gray-900/50 hover:border-amber-500 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h4 className="font-semibold text-amber-100 text-lg">
                                            {payment.membership?.name || 'Membresía'}
                                        </h4>
                                        <p className="text-amber-300 text-sm mt-1">
                                            <strong>Comprado:</strong> {formatDate(payment.purchaseDate)}
                                        </p>
                                        {payment.expirationDate && (
                                            <p className="text-amber-300 text-sm">
                                                <strong>Expira:</strong> {formatDate(payment.expirationDate)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-amber-400 text-xl">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                </div>
                                
                                {payment.status === 'COMPLETADO' && payment.expirationDate && (
                                    <div className="mt-4 p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/50">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div className="flex items-center text-emerald-300">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <span className="font-medium">
                                                    {getDaysLeft(payment.expirationDate) > 0 
                                                        ? `${getDaysLeft(payment.expirationDate)} días restantes`
                                                        : 'Membresía expirada'
                                                    }
                                                </span>
                                            </div>
                                            {getDaysLeft(payment.expirationDate) > 0 && (
                                                <div className="text-sm text-emerald-400">
                                                    {((getDaysLeft(payment.expirationDate) / 30) * 100).toFixed(0)}% restante
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientMembership;