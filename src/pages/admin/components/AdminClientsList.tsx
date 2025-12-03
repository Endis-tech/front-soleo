import { useState, useEffect } from 'react';
import { Users, Mail, Calendar, Activity, Eye, Filter } from 'lucide-react';

// ✅ IMPORTACIONES OFFLINE (descomentamos si las vas a usar en el futuro)
// import { saveOperation } from "../../../offline/db";
// import { triggerSync } from "../../../offline/sync";

interface ClientData {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    weight: number | null;
    exerciseTime: string | null;
    profilePhoto: string | null;
    memberships: any[];
    routines: any[];
    createdAt: string;
    updatedAt: string;
}

// ✅ INTERFAZ VACÍA: el componente es autónomo
interface AdminClientsListProps {}

export function AdminClientsList({}: AdminClientsListProps) {
    const CACHE_KEY = 'adminClients-ui';
    const [clients, setClients] = useState<ClientData[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('TODOS');
    
    // ✅ ✨ AÑADIMOS estado interno para errores (antes venía del padre)
    const [error, setError] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    // ✅ Cargar desde caché si estamos offline
    const loadFromCache = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.warn('No se pudo cargar caché de clientes');
        }
        return [];
    };

    const fetchClients = async () => {
        setLoadingClients(true);
        setError(null); // ✅ Usamos setError en lugar de onSetError
        try {
            const response = await fetch(`${API_URL}/auth/users`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const clientsOnly = data.filter((user: ClientData) => user.role === 'CLIENTE');
            setClients(clientsOnly);
            
            // ✅ Guardar en caché cuando hay conexión
            if (navigator.onLine) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(clientsOnly));
            }
        } catch (error) {
            console.error('❌ Error fetching clients:', error);
            setError('No se pudieron cargar los clientes: ' + (error as Error).message); // ✅
            
            // ✅ Si falla y estamos offline, usar caché
            if (!navigator.onLine) {
                setClients(loadFromCache());
            }
        } finally {
            setLoadingClients(false);
        }
    };

    useEffect(() => {
        if (!navigator.onLine) {
            // ✅ Cargar desde caché al inicio si estamos offline
            setClients(loadFromCache());
            setLoadingClients(false);
        } else {
            fetchClients();
        }
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVO': return 'bg-green-600';
            case 'INACTIVO': return 'bg-yellow-600';
            case 'SUSPENDIDO': return 'bg-orange-600';
            case 'ELIMINADO': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVO': return 'Activo';
            case 'INACTIVO': return 'Inactivo';
            case 'SUSPENDIDO': return 'Suspendido';
            case 'ELIMINADO': return 'Eliminado';
            default: return status;
        }
    };

    const viewClientDetails = (client: ClientData) => {
        setSelectedClient(client);
    };

    const closeClientDetails = () => {
        setSelectedClient(null);
    };

    const refreshClients = () => {
        fetchClients();
    };

    // ✅ Filtrado
    const filteredClients = filterStatus === 'TODOS' 
        ? clients 
        : clients.filter(client => client.status === filterStatus);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-heading font-bold text-white">Listado de Clientes</h1>
                <div className="flex items-center gap-4">
                    <div className="text-soleo-yellow">
                        Total: <span className="font-bold">{filteredClients.length}</span> clientes
                    </div>
                    <button 
                        onClick={refreshClients}
                        className="bg-soleo-yellow text-soleo-text-dark py-2 px-4 rounded-full hover:bg-amber-400 transition-colors font-bold"
                    >
                        Actualizar
                    </button>
                </div>
            </div>
            
            {/* Mensajes */}
            {error && (
                <div className="bg-red-600/20 border border-red-600 text-white p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Filtros */}
            <div className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50 mb-6">
                <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-soleo-yellow" />
                    <span className="text-soleo-yellow font-bold">Filtrar por estado:</span>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-soleo-dark border border-soleo-brown text-white p-2 rounded"
                    >
                        <option value="TODOS">Todos los estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                        <option value="SUSPENDIDO">Suspendidos</option>
                        <option value="ELIMINADO">Eliminados</option>
                    </select>
                </div>
            </div>
            
            {/* Lista de Clientes */}
            {loadingClients ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-soleo-yellow text-lg">Cargando clientes...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredClients.length === 0 ? (
                        <div className="bg-soleo-brown/20 p-12 rounded-lg border border-soleo-brown/50 text-center">
                            <Users className="w-20 h-20 text-soleo-light mx-auto mb-4" />
                            <p className="text-soleo-yellow text-xl mb-2">No hay clientes</p>
                            <p className="text-soleo-light">
                                {filterStatus === 'TODOS' 
                                    ? 'No hay clientes registrados en el sistema.' 
                                    : `No hay clientes con estado "${getStatusText(filterStatus)}".`
                                }
                            </p>
                        </div>
                    ) : (
                        filteredClients.map(client => (
                            <div key={client._id} className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50 hover:border-soleo-yellow/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h2 className="font-bold text-xl text-soleo-yellow">
                                                {client.name}
                                            </h2>
                                            <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(client.status)} font-bold`}>
                                                {getStatusText(client.status)}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-soleo-light">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate">{client.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-soleo-light">
                                                <Calendar className="w-4 h-4" />
                                                <span>Registro: {formatDate(client.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-soleo-light">
                                                <Activity className="w-4 h-4" />
                                                <span>
                                                    {client.weight ? `${client.weight} kg` : 'Sin peso'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-soleo-light">
                                                <span>Horario: {client.exerciseTime || 'No definido'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-6 text-sm">
                                            <div>
                                                <span className="text-soleo-yellow">Membresías: </span>
                                                <span className="font-bold">{client.memberships?.length || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-soleo-yellow">Rutinas: </span>
                                                <span className="font-bold">{client.routines?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-2 ml-4">
                                        <button 
                                            onClick={() => viewClientDetails(client)}
                                            className="bg-blue-600 p-3 rounded-full hover:bg-blue-500 transition-colors flex items-center gap-2"
                                            title="Ver detalles completos"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm font-bold">Detalles</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Detalles del Cliente */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-soleo-dark border-2 border-soleo-brown rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-soleo-brown/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-soleo-yellow">
                                        {selectedClient.name}
                                    </h2>
                                    <p className="text-soleo-light">{selectedClient.email}</p>
                                </div>
                                <button 
                                    onClick={closeClientDetails}
                                    className="text-soleo-light hover:text-white text-2xl font-bold p-2"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-soleo-yellow mb-4 border-b border-soleo-brown/30 pb-2">
                                        Información Personal
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-soleo-brown/10 p-4 rounded">
                                            <span className="text-soleo-light block text-sm">Estado:</span>
                                            <span className={`font-bold ${getStatusColor(selectedClient.status).replace('bg-', 'text-')}`}>
                                                {getStatusText(selectedClient.status)}
                                            </span>
                                        </div>
                                        <div className="bg-soleo-brown/10 p-4 rounded">
                                            <span className="text-soleo-light block text-sm">Peso:</span>
                                            <span className="font-bold text-soleo-yellow">
                                                {selectedClient.weight ? `${selectedClient.weight} kg` : 'No registrado'}
                                            </span>
                                        </div>
                                        <div className="bg-soleo-brown/10 p-4 rounded">
                                            <span className="text-soleo-light block text-sm">Horario preferido:</span>
                                            <span className="font-bold text-soleo-yellow">
                                                {selectedClient.exerciseTime || 'No definido'}
                                            </span>
                                        </div>
                                        <div className="bg-soleo-brown/10 p-4 rounded">
                                            <span className="text-soleo-light block text-sm">Fecha de registro:</span>
                                            <span className="font-bold text-soleo-yellow">
                                                {formatDate(selectedClient.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-bold text-soleo-yellow mb-4 border-b border-soleo-brown/30 pb-2">
                                        Estadísticas
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-soleo-brown/20 p-6 rounded text-center">
                                            <div className="text-3xl font-bold text-soleo-yellow mb-2">
                                                {selectedClient.memberships?.length || 0}
                                            </div>
                                            <div className="text-soleo-light">Membresías</div>
                                        </div>
                                        <div className="bg-soleo-brown/20 p-6 rounded text-center">
                                            <div className="text-3xl font-bold text-soleo-yellow mb-2">
                                                {selectedClient.routines?.length || 0}
                                            </div>
                                            <div className="text-soleo-light">Rutinas</div>
                                        </div>
                                        <div className="bg-soleo-brown/20 p-6 rounded text-center">
                                            <div className="text-3xl font-bold text-soleo-yellow mb-2">
                                                {selectedClient.status === 'ACTIVO' ? 'Sí' : 'No'}
                                            </div>
                                            <div className="text-soleo-light">Activo</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-soleo-brown/50">
                                <button
                                    onClick={closeClientDetails}
                                    className="bg-gray-600 text-white py-3 px-8 rounded-full hover:bg-gray-500 transition-colors font-bold"
                                >
                                    Cerrar
                                </button>
                                <button
                                    className="bg-soleo-yellow text-soleo-text-dark py-3 px-8 rounded-full hover:bg-amber-400 transition-colors font-bold"
                                >
                                    Editar Cliente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminClientsList;