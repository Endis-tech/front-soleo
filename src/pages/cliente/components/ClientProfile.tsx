import React, { useState, useEffect } from 'react';
import { User, Camera, Mail, Calendar, Save, Edit3, X, Scale, Clock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../../../api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    membership: string;
    profilePhoto?: string;
    createdAt: string;
    weight?: number;
    exerciseTime?: string;
}

interface ClientProfileProps {
    user: User;
    onUserUpdate?: (updatedUser: User) => void;
}

export function ClientProfile({ user, onUserUpdate }: ClientProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User>(user);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const handleInputChange = (field: keyof User, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCancel = () => {
        setFormData(user);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setIsEditing(false);
        setMessage(null);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setMessage(null);

            if (!formData.name.trim() || !formData.email.trim()) {
                setMessage({ type: 'error', text: 'Nombre y email son obligatorios' });
                return;
            }

            if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
                setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
                return;
            }

            const updateData: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                weight: formData.weight,
                exerciseTime: formData.exerciseTime
            };

            if (passwordData.newPassword) {
                if (!passwordData.currentPassword) {
                    setMessage({ type: 'error', text: 'La contraseña actual es requerida para cambiar la contraseña' });
                    return;
                }
                updateData.password = passwordData.newPassword;
                updateData.currentPassword = passwordData.currentPassword;
            }

            const { data } = await api.put('/users/profile', updateData);
            
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            setIsEditing(false);
            
            if (onUserUpdate) {
                onUserUpdate(data.user);
            }
            setFormData(data.user);
            
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (err: any) {
            console.error('❌ Error al guardar:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Error al actualizar el perfil' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const uploadFormData = new FormData();
            uploadFormData.append('photo', file);

            const { data } = await api.put('/users/profile/photo', uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage({ type: 'success', text: 'Foto actualizada correctamente' });
            
            if (onUserUpdate) {
                onUserUpdate(data.user);
            }
            setFormData(data.user);

        } catch (err: any) {
            console.error('❌ Error al subir foto:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Error al subir la foto. Intenta con una imagen más pequeña.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
            return;
        }

        if (!window.confirm('¿CONFIRMAS que quieres eliminar tu cuenta permanentemente? Todos tus datos se perderán.')) {
            return;
        }

        try {
            setDeleteLoading(true);
            setMessage(null);
            
            const response = await api.delete('/users/profile');
            
            setMessage({ type: 'success', text: 'Cuenta eliminada correctamente. Redirigiendo...' });
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);

        } catch (err: any) {
            console.error('❌ Error completo al eliminar cuenta:', err);
            let errorMessage = 'Error al eliminar la cuenta';
            if (err.response?.status === 500) {
                errorMessage = 'Error del servidor. Por favor, contacta al administrador.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            setMessage({ 
                type: 'error', 
                text: errorMessage 
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const getProfilePhotoUrl = (photoPath: string | undefined) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '');
        if (photoPath.startsWith('/uploads')) {
            return `${baseUrl}${photoPath}`;
        }
        return `${baseUrl}/uploads/profile/${photoPath}`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 text-amber-100 min-h-screen bg-black">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Mi Perfil</h1>
                    <p className="text-amber-300 mt-1">Gestiona tu información personal y preferencias</p>
                </div>
                
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                    >
                        <Edit3 className="w-5 h-5" />
                        <span>Editar Perfil</span>
                    </button>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCancel}
                            className="border border-amber-700 text-amber-200 px-6 py-3 rounded-xl font-semibold hover:bg-amber-900/30 transition-all duration-300 flex items-center space-x-2"
                        >
                            <X className="w-5 h-5" />
                            <span>Cancelar</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Mensajes de estado */}
            {message && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    message.type === 'success' 
                        ? 'bg-emerald-900/30 border-emerald-600 text-emerald-200' 
                        : 'bg-red-900/30 border-red-600 text-red-200'
                }`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {message.type === 'success' ? '✅' : '❌'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tarjeta principal */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-amber-900/30">
                <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* Foto de Perfil */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="w-32 h-32 bg-amber-900/50 rounded-full flex items-center justify-center border-4 border-amber-600 overflow-hidden shadow-2xl">
                                {formData.profilePhoto ? (
                                    <img 
                                        src={getProfilePhotoUrl(formData.profilePhoto) || ''}
                                        alt="Foto de perfil"
                                        className="w-full h-full rounded-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : null}
                                {(!formData.profilePhoto || formData.profilePhoto === '') && (
                                    <User className="w-16 h-16 text-amber-300" />
                                )}
                            </div>
                            {isEditing && (
                                <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-3 rounded-full shadow-2xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 cursor-pointer border-2 border-amber-900">
                                    <Camera className="w-5 h-5" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        disabled={loading}
                                    />
                                </label>
                            )}
                        </div>
                        {isEditing && (
                            <p className="text-xs text-amber-400 mt-3 text-center max-w-[120px]">
                                Haz clic en la cámara para cambiar tu foto
                            </p>
                        )}
                    </div>
                    
                    {/* Información del Usuario */}
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-amber-200">
                                            Nombre completo *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                            required
                                            disabled={loading}
                                            placeholder="Ingresa tu nombre completo"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-amber-200">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                            required
                                            disabled={loading}
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-amber-200 flex items-center gap-2">
                                            <Scale className="w-4 h-4" />
                                            Peso (kg)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.weight || ''}
                                            onChange={(e) => handleInputChange('weight', e.target.value ? Number(e.target.value) : null)}
                                            className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                            placeholder="Ej: 75"
                                            min="0"
                                            step="0.1"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-amber-200 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Horario preferido
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.exerciseTime || ''}
                                            onChange={(e) => handleInputChange('exerciseTime', e.target.value)}
                                            className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-amber-100 mb-3">{formData.name}</h2>
                                    
                                    <div className="flex items-center gap-3 text-amber-300 mb-2">
                                        <Mail className="w-5 h-5" />
                                        <span className="text-lg">{formData.email}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-amber-400">
                                        <Calendar className="w-5 h-5" />
                                        <span>
                                            Miembro desde: <strong className="text-amber-200">{new Date(formData.createdAt).toLocaleDateString('es-ES')}</strong>
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.weight && (
                                        <div className="flex items-center gap-3 text-amber-200 bg-amber-900/20 p-4 rounded-xl border border-amber-800/30">
                                            <Scale className="w-5 h-5 text-amber-300" />
                                            <span>Peso: <strong className="text-amber-100">{formData.weight} kg</strong></span>
                                        </div>
                                    )}
                                    {formData.exerciseTime && (
                                        <div className="flex items-center gap-3 text-amber-200 bg-amber-900/20 p-4 rounded-xl border border-amber-800/30">
                                            <Clock className="w-5 h-5 text-amber-300" />
                                            <span>Horario preferido: <strong className="text-amber-100">{formData.exerciseTime}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cambio de Contraseña */}
                {isEditing && (
                    <div className="mt-8 pt-8 border-t border-amber-800/30">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-6 h-6 text-amber-300" />
                            <h3 className="text-xl font-bold text-amber-100">Seguridad y Contraseña</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-amber-200">
                                    Contraseña actual
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                        className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-amber-200 transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-amber-200">
                                    Nueva contraseña
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                    className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-amber-200">
                                    Confirmar nueva contraseña
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                    className="w-full border border-amber-800/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-amber-100"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        {passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Las contraseñas no coinciden
                            </p>
                        )}
                        {passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword && (
                            <p className="text-emerald-400 text-sm mt-3 flex items-center gap-2">
                                ✅ Las contraseñas coinciden
                            </p>
                        )}
                    </div>
                )}

                {/* Eliminar Cuenta */}
                <div className="mt-8 pt-8 border-t border-amber-800/30">
                    <div className="text-center bg-red-900/20 rounded-2xl p-6 border border-red-800/30">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <h4 className="text-lg font-semibold text-red-300">Zona de Peligro</h4>
                        </div>
                        <p className="text-red-300 mb-4 max-w-2xl mx-auto">
                            Una vez que elimines tu cuenta, no hay vuelta atrás. Se perderán todos tus datos de forma permanente.
                        </p>
                        <button 
                            onClick={handleDeleteAccount}
                            disabled={deleteLoading || loading}
                            className="border-2 border-red-600 text-red-300 px-8 py-3 rounded-xl font-semibold hover:bg-red-900/40 transition-all duration-300 disabled:opacity-50"
                        >
                            {deleteLoading ? 'Eliminando...' : 'Eliminar Cuenta Permanentemente'}
                        </button>
                        {message?.type === 'error' && message.text.includes('eliminar') && (
                            <p className="text-red-400 text-sm mt-3">
                                💡 Si el problema persiste, contacta con soporte técnico.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientProfile;