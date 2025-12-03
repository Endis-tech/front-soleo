import { useState, useEffect } from 'react';
import { CreditCard, Calendar, User, DollarSign, Filter, Download, Search } from 'lucide-react';

interface Payment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  membership: {
    _id: string;
    name: string;
    price: number;
  } | null;
  amount: number;
  status: 'COMPLETADO' | 'PENDIENTE' | 'CANCELADO' | 'FAILED';
  paymentMethod?: string;
  purchaseDate: string;
  expirationDate: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  transactionId?: string;
  notes?: string;
  replacedPreviousMembership?: boolean;
  previousMembership?: string | null;
}

// ✅ ELIMINADA onSetSuccess de la interfaz
interface AdminPaymentHistoryProps {
  error: string | null;
  success: string | null;
  onSetError: (error: string | null) => void;
  // onSetSuccess: (success: string | null) => void; // ❌ Eliminada
}

// ✅ ELIMINADA onSetSuccess de las props
export function AdminPaymentHistory({ error, success, onSetError }: AdminPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Fetch todos los pagos
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payments/history`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al cargar el historial de pagos');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Pagos cargados:', data.payments);
        setPayments(data.payments || []);
      } else {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      onSetError('No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // 🔥 FUNCIONES SEGURAS PARA MANEJAR DATOS NULL
  const getUserName = (user: any) => {
    return user?.name || 'Usuario no encontrado';
  };

  const getUserEmail = (user: any) => {
    return user?.email || 'Email no disponible';
  };

  const getMembershipName = (membership: any) => {
    return membership?.name || 'Membresía no encontrada';
  };

  // ❌ ELIMINADA getMembershipPrice (nunca se usaba)

  // Filtrar pagos - SOLO LOS QUE TIENEN paypalOrderId (comprados por PayPal)
  const filteredPayments = payments.filter(payment => {
    // ✅ Solo mostrar pagos con PayPal
    if (!payment.paypalOrderId) {
      return false;
    }

    // Filtro por estado
    if (filterStatus !== 'all' && payment.status !== filterStatus) {
      return false;
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const userName = getUserName(payment.user).toLowerCase();
      const userEmail = getUserEmail(payment.user).toLowerCase();
      const membershipName = getMembershipName(payment.membership).toLowerCase();
      
      if (!userName.includes(searchTerm.toLowerCase()) &&
          !userEmail.includes(searchTerm.toLowerCase()) &&
          !membershipName.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Filtro por fecha
    if (dateRange.start && new Date(payment.purchaseDate) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(payment.purchaseDate) > new Date(dateRange.end)) {
      return false;
    }

    return true;
  });

  // Estadísticas - SOLO PAGOS PAYPAL
  const paypalPayments = payments.filter(p => p.paypalOrderId);
  
  const stats = {
    total: paypalPayments.length,
    completed: paypalPayments.filter(p => p.status === 'COMPLETADO').length,
    pending: paypalPayments.filter(p => p.status === 'PENDIENTE').length,
    revenue: paypalPayments
      .filter(p => p.status === 'COMPLETADO')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return 'bg-green-100 text-green-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return 'Completado';
      case 'PENDIENTE': return 'Pendiente';
      case 'CANCELADO': return 'Cancelado';
      case 'FAILED': return 'Fallido';
      default: return status;
    }
  };

  const getMethodText = (payment: Payment) => {
    if (payment.paypalOrderId) return 'PayPal';
    return 'Otro método';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Usuario', 'Email', 'Membresía', 'Monto', 'Estado', 'Método', 'Fecha Compra', 'Fecha Expiración', 'ID PayPal'];
    const csvData = filteredPayments.map(payment => [
      getUserName(payment.user),
      getUserEmail(payment.user),
      getMembershipName(payment.membership),
      payment.amount,
      getStatusText(payment.status),
      getMethodText(payment),
      new Date(payment.purchaseDate).toLocaleDateString(),
      new Date(payment.expirationDate).toLocaleDateString(),
      payment.paypalOrderId || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pagos-paypal-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-soleo-yellow text-lg">Cargando historial de pagos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white">Historial de Pagos PayPal</h1>
          <p className="text-soleo-light mt-2">
            Gestiona y revisa todos los pagos procesados por PayPal
          </p>
        </div>
        
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-bold flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Mensajes */}
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-soleo-yellow" />
            <div>
              <p className="text-soleo-light text-sm">Total Pagos PayPal</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-soleo-light text-sm">Completados</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-soleo-light text-sm">Pendientes</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-soleo-light text-sm">Ingresos PayPal</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-soleo-light" />
            <input
              type="text"
              placeholder="Buscar por usuario, email o membresía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-soleo-dark border border-soleo-brown text-white p-2 rounded flex-1 min-w-0"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-soleo-dark border border-soleo-brown text-white p-2 rounded"
            >
              <option value="all">Todos los estados</option>
              <option value="COMPLETADO">Completados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CANCELADO">Cancelados</option>
            </select>

            <input
              type="date"
              placeholder="Desde"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-soleo-dark border border-soleo-brown text-white p-2 rounded"
            />

            <input
              type="date"
              placeholder="Hasta"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-soleo-dark border border-soleo-brown text-white p-2 rounded"
            />

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setDateRange({ start: '', end: '' });
              }}
              className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-500 transition-colors font-bold flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de pagos - SIN COLUMNA ACCIONES */}
      <div className="bg-soleo-brown/20 rounded-lg border border-soleo-brown/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-soleo-brown/30 border-b border-soleo-brown/50">
                <th className="text-left p-4 text-soleo-yellow font-bold">Usuario</th>
                <th className="text-left p-4 text-soleo-yellow font-bold">Membresía</th>
                <th className="text-left p-4 text-soleo-yellow font-bold">Monto</th>
                <th className="text-left p-4 text-soleo-yellow font-bold">Estado</th>
                <th className="text-left p-4 text-soleo-yellow font-bold">Método</th>
                <th className="text-left p-4 text-soleo-yellow font-bold">Fecha Compra</th>
                <th className="text-left p-4 text-soleo-yellow font-bold">ID PayPal</th>
                {/* ✅ COLUMNA ACCIONES ELIMINADA */}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-soleo-light">
                    {payments.length === 0 
                      ? 'No hay pagos registrados en el sistema' 
                      : 'No se encontraron pagos PayPal con los filtros aplicados'
                    }
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-b border-soleo-brown/30 hover:bg-soleo-brown/10">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{getUserName(payment.user)}</p>
                        <p className="text-sm text-soleo-light">{getUserEmail(payment.user)}</p>
                      </div>
                    </td>
                    <td className="p-4 text-white">{getMembershipName(payment.membership)}</td>
                    <td className="p-4 text-soleo-yellow font-bold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="p-4 text-soleo-light">
                      {getMethodText(payment)}
                    </td>
                    <td className="p-4 text-soleo-light">
                      {formatDate(payment.purchaseDate)}
                    </td>
                    <td className="p-4 text-soleo-light text-xs font-mono">
                      {payment.paypalOrderId || 'N/A'}
                    </td>
                    {/* ✅ CELDA DE ACCIONES ELIMINADA */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información de pagos */}
      <div className="text-soleo-light text-sm">
        <p>Mostrando {filteredPayments.length} de {payments.filter(p => p.paypalOrderId).length} pagos PayPal</p>
        <p className="text-soleo-yellow mt-1">
          💡 Solo se muestran pagos procesados a través de PayPal
        </p>
      </div>
    </div>
  );
}