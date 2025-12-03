import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit3, X, Save, Dumbbell, AlertTriangle } from 'lucide-react';

import { saveOperation } from "../../../offline/db";
import { triggerSync } from "../../../offline/sync";

interface RoutineData {
    _id: string;
    name: string;
    status: boolean;
}

interface MembershipData {
    _id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    status: "ACTIVO" | "INACTIVO";
    isDefault: boolean;
    routine?: RoutineData;
    createdAt: string;
    updatedAt: string;
}

interface MembershipFormData {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    status: "ACTIVO" | "INACTIVO";
    routine: string;
}

// ✅ INTERFAZ SIMPLIFICADA: solo lo que realmente se usa
interface AdminMembershipsProps {
    memberships: MembershipData[];
    loadingMemberships: boolean;
    onFetchMemberships: () => Promise<void>;
}

interface Message {
  type: 'success' | 'error';
  text: string;
  id: string;
}

// Modal de confirmación (sin cambios)
function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    membershipName
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    membershipName: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-soleo-dark border border-soleo-brown rounded-lg max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-500/20 p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Eliminar Membresía</h3>
                </div>
                
                <p className="text-soleo-light mb-6">
                    ¿Estás seguro de que quieres eliminar la membresía <span className="font-bold text-soleo-yellow">"{membershipName}"</span>? 
                    Esta acción no se puede deshacer.
                </p>
                
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ✅ Componente con solo las props necesarias
export function AdminMemberships({ 
    memberships, 
    loadingMemberships,
    onFetchMemberships,
}: AdminMembershipsProps) {
    
    const CACHE_KEY = 'admin-memberships-ui';
    const [safeMemberships, setSafeMemberships] = useState<MembershipData[]>([]);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        membershipId: string | null;
        membershipName: string;
    }>({
        isOpen: false,
        membershipId: null,
        membershipName: ''
    });

    // ✅ Sistema de mensajes interno
    const [messages, setMessages] = useState<Message[]>([]);

    const showMessage = (type: 'success' | 'error', baseText: string) => {
      const text = navigator.onLine
        ? baseText.replace('localmente. Se enviará cuando haya conexión.', 'exitosamente.')
        : baseText;

      const newMessage: Message = {
        type,
        text,
        id: Date.now().toString()
      };

      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => closeMessage(newMessage.id), 5000);
    };

    const closeMessage = (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    };

    const normalizeAndSetMemberships = (data: any) => {
        let normalizedArray: MembershipData[] = [];
        if (Array.isArray(data)) {
            normalizedArray = data;
        } else if (data && typeof data === 'object') {
            if (Array.isArray(data.memberships)) {
                normalizedArray = data.memberships;
            } else if (Array.isArray(data.data)) {
                normalizedArray = data.data;
            }
        }
        setSafeMemberships(normalizedArray);
        if (navigator.onLine) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(normalizedArray));
        }
    };

    useEffect(() => {
        if (!navigator.onLine) {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    setSafeMemberships(JSON.parse(cached));
                    return;
                }
            } catch (e) {
                console.warn('No se pudo cargar caché');
            }
        }
        normalizeAndSetMemberships(memberships);
    }, [memberships]);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingMembership, setEditingMembership] = useState<MembershipData | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [routines, setRoutines] = useState<RoutineData[]>([]);
    const [loadingRoutines, setLoadingRoutines] = useState(false);
    
    const [formData, setFormData] = useState<MembershipFormData>({
        name: '',
        description: '',
        price: 0,
        durationDays: 30,
        status: 'ACTIVO',
        routine: ''
    });

    const API_URL = import.meta.env.VITE_API_URL;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    useEffect(() => {
        fetchRoutines();
    }, []);

    const fetchRoutines = async () => {
        setLoadingRoutines(true);
        try {
            const response = await fetch(`${API_URL}/routines`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setRoutines(data.routines || []);
                if (data.routines && data.routines.length > 0) {
                    setFormData(prev => ({ 
                        ...prev, 
                        routine: data.routines[0]._id 
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading routines:', error);
            showMessage('error', 'Error al cargar rutinas');
        } finally {
            setLoadingRoutines(false);
        }
    };

    const openDeleteModal = (membershipId: string, membershipName: string) => {
        setDeleteModal({
            isOpen: true,
            membershipId,
            membershipName
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            isOpen: false,
            membershipId: null,
            membershipName: ''
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.membershipId) return;
        const membershipToDelete = safeMemberships.find(m => m._id === deleteModal.membershipId);
        if (!membershipToDelete) return;

        const updatedMemberships = safeMemberships.filter(m => m._id !== deleteModal.membershipId);
        setSafeMemberships(updatedMemberships);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedMemberships));

        await saveOperation({
            type: 'DELETE',
            resource: 'membership',
            payload: { id: deleteModal.membershipId },
            timestamp: Date.now()
        });

        closeDeleteModal();
        showMessage('success', 'Membresía eliminada. Se sincronizará cuando haya conexión.');
        
        if (navigator.onLine) {
            triggerSync();
            setTimeout(() => {
                onFetchMemberships();
            }, 800);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'durationDays' ? Number(value) : value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            durationDays: 30,
            status: 'ACTIVO',
            routine: routines.length > 0 ? routines[0]._id : ''
        });
        setShowCreateForm(false);
        setEditingMembership(null);
    };

    const createMembership = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (!formData.routine) {
                throw new Error('Debe seleccionar una rutina');
            }

            const tempMembership: MembershipData = {
                _id: `temp-${Date.now()}`,
                name: formData.name,
                description: formData.description,
                price: formData.price,
                durationDays: formData.durationDays,
                status: formData.status,
                isDefault: false,
                routine: routines.find(r => r._id === formData.routine),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const newMemberships = [...safeMemberships, tempMembership];
            setSafeMemberships(newMemberships);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newMemberships));

            await saveOperation({
                type: 'CREATE',
                resource: 'membership',
                payload: formData,
                timestamp: Date.now()
            });

            resetForm();
            showMessage('success', 'Membresía guardada localmente. Se enviará cuando haya conexión.');
            
            if (navigator.onLine) {
                triggerSync();
                setTimeout(() => {
                    onFetchMemberships();
                }, 800);
            }

        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Error al crear membresía');
        } finally {
            setFormLoading(false);
        }
    };

    const updateMembership = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMembership) return;

        setFormLoading(true);

        try {
            if (!formData.routine) {
                throw new Error('Debe seleccionar una rutina');
            }

            const updatedMembership: MembershipData = {
                ...editingMembership,
                name: formData.name,
                description: formData.description,
                price: formData.price,
                durationDays: formData.durationDays,
                status: formData.status,
                routine: routines.find(r => r._id === formData.routine)
            };

            const updatedMemberships = safeMemberships.map(m => 
                m._id === editingMembership._id ? updatedMembership : m
            );
            setSafeMemberships(updatedMemberships);
            localStorage.setItem(CACHE_KEY, JSON.stringify(updatedMemberships));

            await saveOperation({
                type: 'UPDATE',
                resource: 'membership',
                payload: {
                    id: editingMembership._id,
                    ...formData
                },
                timestamp: Date.now()
            });

            resetForm();
            showMessage('success', 'Membresía actualizada localmente. Se enviará cuando haya conexión.');
            
            if (navigator.onLine) {
                triggerSync();
                setTimeout(() => {
                    onFetchMemberships();
                }, 800);
            }

        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Error al actualizar membresía');
        } finally {
            setFormLoading(false);
        }
    };

    const startEdit = (membership: MembershipData) => {
        setEditingMembership(membership);
        const routineId = membership.routine?._id || '';
        setFormData({
            name: membership.name,
            description: membership.description,
            price: membership.price,
            durationDays: membership.durationDays,
            status: membership.status,
            routine: routineId
        });
        setShowCreateForm(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const formatDuration = (days: number) => {
        if (days === 1) return '1 día';
        if (days < 30) return `${days} días`;
        if (days === 30) return '1 mes';
        if (days < 365) return `${Math.floor(days / 30)} meses`;
        return `${Math.floor(days / 365)} años`;
    };

    const getRoutineName = (routine: RoutineData | undefined) => {
        return routine?.name || 'Rutina no asignada';
    };

    return (
        <div>
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                membershipName={deleteModal.membershipName}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-heading font-bold text-white">Administrar Membresías</h1>
                <button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-soleo-yellow text-soleo-text-dark py-2 px-4 rounded-full hover:bg-amber-400 transition-colors font-bold"
                >
                    <PlusCircle className="w-5 h-5 inline mr-2" />
                    Nueva Membresía
                </button>
            </div>
            
            {/* ✅ Mensajes con botón de cierre */}
            {messages.map(message => (
              <div 
                key={message.id}
                className={`${
                  message.type === 'success' 
                    ? 'bg-green-600/20 border border-green-600' 
                    : 'bg-red-600/20 border border-red-600'
                } text-white p-4 rounded-lg mb-4 relative`}
              >
                <span>{message.text}</span>
                <button
                  onClick={() => closeMessage(message.id)}
                  className="absolute top-2 right-2 text-white/70 hover:text-white"
                  aria-label="Cerrar mensaje"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}

            {(showCreateForm || editingMembership) && (
                <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-soleo-yellow">
                            {editingMembership ? 'Editar Membresía' : 'Nueva Membresía'}
                        </h2>
                        <button 
                            onClick={resetForm}
                            className="text-soleo-light hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={editingMembership ? updateMembership : createMembership} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-soleo-yellow mb-2">Nombre *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 rounded-lg bg-soleo-dark border border-soleo-brown text-white"
                                    placeholder="Ej: Premium, Básica, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-soleo-yellow mb-2">Precio (MXN) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full p-3 rounded-lg bg-soleo-dark border border-soleo-brown text-white"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-soleo-yellow mb-2">Duración (días) *</label>
                                <input
                                    type="number"
                                    name="durationDays"
                                    value={formData.durationDays}
                                    onChange={handleInputChange}
                                    required
                                    min="1"
                                    className="w-full p-3 rounded-lg bg-soleo-dark border border-soleo-brown text-white"
                                    placeholder="30"
                                />
                            </div>

                            <div>
                                <label className="block text-soleo-yellow mb-2">Estado</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full p-3 rounded-lg bg-soleo-dark border border-soleo-brown text-white"
                                >
                                    <option value="ACTIVO">ACTIVO</option>
                                    <option value="INACTIVO">INACTIVO</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-soleo-yellow mb-2">
                                    <Dumbbell className="w-4 h-4 inline mr-2" />
                                    Rutina Asignada *
                                </label>
                                <select
                                    name="routine"
                                    value={formData.routine}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 rounded-lg bg-soleo-dark border border-soleo-brown text-white"
                                    disabled={loadingRoutines}
                                >
                                    <option value="">Seleccionar rutina...</option>
                                    {routines.map(routine => (
                                        <option key={routine._id} value={routine._id}>
                                            {routine.name} {routine.status ? '' : '(Inactiva)'}
                                        </option>
                                    ))}
                                </select>
                                {loadingRoutines && (
                                    <p className="text-soleo-yellow text-sm mt-1">Cargando rutinas...</p>
                                )}
                                {routines.length === 0 && !loadingRoutines && (
                                    <p className="text-red-400 text-sm mt-1">No hay rutinas disponibles</p>
                                )}
                                <p className="text-soleo-light text-sm mt-1">
                                    Todos los usuarios con esta membresía tendrán acceso a esta rutina
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-soleo-yellow mb-2">Descripción</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full p-3 rounded-lg bg-soleo-dark border border-soleo-brown text-white"
                                placeholder="Descripción de la membresía..."
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="flex items-center gap-2 bg-soleo-yellow text-soleo-text-dark py-3 px-6 rounded-full hover:bg-amber-400 transition-colors font-bold disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {formLoading ? 'Guardando...' : (editingMembership ? 'Actualizar' : 'Crear Membresía')}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-600 text-white py-3 px-6 rounded-full hover:bg-gray-500 transition-colors font-bold"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {loadingMemberships ? (
                <p className="text-soleo-yellow text-lg">Cargando membresías...</p>
            ) : (
                <div className="space-y-4">
                    {safeMemberships.length === 0 ? (
                        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50 text-center">
                            <p className="text-soleo-yellow text-lg">No hay membresías creadas</p>
                            <p className="text-soleo-light">Crea tu primera membresía haciendo clic en el botón "Nueva Membresía"</p>
                        </div>
                    ) : (
                        safeMemberships.map(membership => (
                            <div key={membership._id} className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="font-bold text-xl text-soleo-yellow">
                                                {membership.name}
                                            </h2>
                                            {membership.isDefault && (
                                                <span className="bg-green-600 text-xs px-2 py-1 rounded-full">
                                                    DEFAULT
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                membership.status === 'ACTIVO' 
                                                    ? 'bg-green-600' 
                                                    : 'bg-red-600'
                                            }`}>
                                                {membership.status}
                                            </span>
                                        </div>
                                        <p className="text-soleo-light mb-3">{membership.description}</p>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <Dumbbell className="w-4 h-4 text-soleo-yellow" />
                                            <span className="text-soleo-yellow text-sm">Rutina: </span>
                                            <span className="font-bold text-white">
                                                {getRoutineName(membership.routine)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-6 text-sm">
                                            <div>
                                                <span className="text-soleo-yellow">Precio: </span>
                                                <span className="font-bold">{formatPrice(membership.price)}</span>
                                            </div>
                                            <div>
                                                <span className="text-soleo-yellow">Duración: </span>
                                                <span className="font-bold">{formatDuration(membership.durationDays)}</span>
                                            </div>
                                            <div>
                                                <span className="text-soleo-yellow">Creado: </span>
                                                <span className="font-bold">
                                                    {new Date(membership.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => startEdit(membership)}
                                            className="bg-amber-500 p-2 rounded-full hover:bg-amber-400 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        {!membership.isDefault && (
                                            <button 
                                                onClick={() => openDeleteModal(membership._id, membership.name)}
                                                className="bg-red-600 p-2 rounded-full hover:bg-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default AdminMemberships;