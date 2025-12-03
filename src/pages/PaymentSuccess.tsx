// src/pages/PaymentSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '../api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const capturePayment = async () => {
            try {
                const token = searchParams.get('token');
                const payerID = searchParams.get('PayerID');
                
                console.log('💰 Capturando pago...', { token, payerID });

                if (!token) {
                    throw new Error('No se pudo obtener el token de pago');
                }

                // Capturar el pago en el backend
                const response = await api.post('/payments/capture', { 
                    orderId: token 
                });

                if (response.data.success) {
                    setStatus('success');
                    setMessage('¡Pago completado exitosamente! Tu membresía ha sido activada.');
                    
                    // Redirigir al dashboard después de 3 segundos
                    setTimeout(() => {
                        navigate('/cliente-dashboard');
                    }, 3000);
                }
            } catch (error: any) {
                console.error('❌ Error capturando pago:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Error al procesar el pago');
            }
        };

        capturePayment();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-soleo-yellow mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-900">Procesando pago...</h2>
                        <p className="text-gray-600 mt-2">Por favor espera un momento.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">¡Pago Exitoso!</h2>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirigiendo al dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Error en el pago</h2>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <button
                            onClick={() => navigate('/cliente-dashboard')}
                            className="mt-4 bg-soleo-yellow text-soleo-text-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
                        >
                            Volver al Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;