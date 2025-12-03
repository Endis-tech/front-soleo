import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, KeySquare } from 'lucide-react';
import { api, setAuth } from '../api.ts'; // Asegúrate que la ruta a api.ts sea correcta

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación simple
    if (!name || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }


    setLoading(true);

    try {
      // Llama a tu endpoint de registro en la API
      const { data } = await api.post('/auth/register', { 
        name, 
        email, 
        password 
      });

      // Asumimos que el backend devuelve un token al registrarse
      const token = data?.token;
      if (token) {
        // Guardar token, actualizar auth y redirigir
        localStorage.setItem('token', token);
        setAuth(token);
        navigate('/dashboard'); // Redirige al dashboard
      } else {
        setError('Registro exitoso, pero no se recibió token. Intenta iniciar sesión.');
      }
    } catch (err: any) {
      // Manejo de errores
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al registrar la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-soleo-dark font-sans p-6">
      <div className="w-full max-w-md">
        
        {/* Logo y Título */}
        <div className="flex flex-col items-center mb-8">
         <img src="/images/soleo.png"  width={120} />
          <h1 className="font-heading text-4xl font-bold text-white mt-4">
            Crea tu Cuenta
          </h1>
          <p className="text-soleo-light text-lg">
            Empieza tu racha hoy mismo.
          </p>
        </div>

        {/* Formulario de Registro */}
        <form 
          onSubmit={handleSubmit}
          className="bg-soleo-brown rounded-2xl shadow-xl p-8 space-y-6"
        >
          {/* Campo de Usuario */}
          <div className="relative">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soleo-light/50" />
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-soleo-dark/50 border-2 border-transparent focus:border-soleo-yellow text-white placeholder:text-soleo-light/50 rounded-lg py-3 pl-12 pr-4 transition-colors duration-300 outline-none"
            />
          </div>

          {/* Campo de Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soleo-light/50" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-soleo-dark/50 border-2 border-transparent focus:border-soleo-yellow text-white placeholder:text-soleo-light/50 rounded-lg py-3 pl-12 pr-4 transition-colors duration-300 outline-none"
            />
          </div>

          {/* Campo de Contraseña */}
          <div className="relative">
            <KeySquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soleo-light/50" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-soleo-dark/50 border-2 border-transparent focus:border-soleo-yellow text-white placeholder:text-soleo-light/50 rounded-lg py-3 pl-12 pr-4 transition-colors duration-300 outline-none"
            />
          </div>


          {/* Mensaje de Error */}
          {error && (
            <p className="text-center text-red-400 text-sm">{error}</p>
          )}

          {/* Botón de Registro */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-soleo-yellow text-soleo-dark font-heading font-bold text-lg py-3 rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Link a Login */}
        <p className="text-center text-soleo-light mt-8">
          ¿Ya tienes una cuenta?{' '}
          <Link 
            to="/login" 
            className="font-bold text-soleo-yellow hover:underline"
          >
            Inicia Sesión
          </Link>
        </p>

      </div>
    </div>
  );
}