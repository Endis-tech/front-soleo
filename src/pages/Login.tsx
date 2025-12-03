import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sun } from 'lucide-react';
// --- CORRECCIÓN DE RUTA ---
// La ruta a tu 'api.ts' es '../api' (sube un nivel de 'pages' a 'src')
// Dejamos la ruta sin la extensión .ts para que el compilador la resuelva automáticamente.
import { api, setAuth } from '../api'; 
// -------------------------

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const { data } = await api.post('/auth/login', { email, password });

        console.log('🔐 Respuesta completa del login:', data); // Debug para ver la estructura

        const token = data?.token;
        const userData = data?.user; // ← Esto debería contener todos los datos del usuario
        const role = userData?.role || data?.role; // ← El role puede venir en user o directamente

        if (token && userData && role) {
            // 1. Configurar auth en API
            setAuth(token); 
            
            // 2. Guardar TODO en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('user', JSON.stringify(userData)); // ← ¡ESTO ES LO QUE FALTA!
            
            console.log('✅ Datos guardados en localStorage:');
            console.log('Token:', token);
            console.log('Role:', role);
            console.log('User:', userData);

            // 3. Redirigir según el rol
            if (role === 'ADMIN') {
                navigate('/admin-dashboard'); 
            } else if (role === 'CLIENTE') {
                navigate('/cliente-dashboard');
            }
        } else {
            setError('Respuesta inválida del servidor (faltan datos de usuario).');
        }
    } catch (err: any) {
        console.error('Error de login:', err);
        setError(err.response?.data?.message || 'Email o contraseña incorrectos.');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center bg-soleo-dark p-6" style={{
            backgroundSize: 'cover',
        }}>
            <div className="w-full max-w-md bg-soleo-brown/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-soleo-brown/50">
                
                <Link to="/" className="flex justify-center items-center mb-6">
                    <h1 className="text-5xl font-heading font-bold text-white flex items-center">
                        SÓLEO <img src="/images/soleo.png"  width={100} alt="Logo Sóleo" />
                    </h1>
                </Link>

                <h2 className="text-2xl font-bold text-center text-soleo-light mb-8">
                    Inicia Sesión
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-soleo-light/80 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-soleo-dark/50 border border-soleo-brown/70 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-soleo-yellow"
                            placeholder="tu@email.com"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-soleo-light/80 text-sm font-bold mb-2" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-soleo-dark/50 border border-soleo-brown/70 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-soleo-yellow"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-soleo-yellow text-soleo-text-dark font-bold font-heading py-3 px-6 rounded-full transition-all duration-300
                                ${loading 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-yellow-300 transform hover:scale-105'
                                }`}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>

                    <p className="text-center text-soleo-light/80">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="font-bold text-soleo-green hover:underline">
                            Regístrate
                        </Link>
                    </p>
                    
                    <p className="text-center text-sm text-soleo-light/70 mt-4">
                        <Link to="/" className="hover:underline">
                            &larr; Volver a la página principal
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}