// src/pages/PaymentCancel.tsx
// import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Pago Cancelado</h2>
                <p className="text-gray-600 mt-2">
                    Has cancelado el proceso de pago. No se ha realizado ningún cargo.
                </p>
                
                <div className="mt-6 space-y-3">
                    <button
                        onClick={() => navigate('/cliente-dashboard')}
                        className="w-full bg-soleo-yellow text-soleo-text-dark font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                        Volver al Dashboard
                    </button>
                    
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Intentar de nuevo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;