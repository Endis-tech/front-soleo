import { useState, useEffect } from 'react';
import { UserPlus, Mail, Lock, User, Shield, Eye, EyeOff, CheckCircle, XCircle, WifiOff } from 'lucide-react';

// ✅ INTERFAZ VACÍA: el componente es autónomo
interface AdminRegisterProps {}

export function AdminRegister({}: AdminRegisterProps) {
  // ✅ AÑADIMOS estado interno para mensajes
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'ADMIN' | 'CLIENTE';
  }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN'
  });
  const [isOnline, setIsOnline] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // ✅ Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const validateForm = (): boolean => {
    if (!isOnline) {
      setError('No puedes registrar usuarios sin conexión a internet');
      return false;
    }

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('El formato del email no es válido');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register-admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'ADMIN'
      });

      setSuccess(`Usuario ${formData.role.toLowerCase()} registrado exitosamente`);

    } catch (error) {
      console.error('❌ Error registrando usuario:', error);
      setError(error instanceof Error ? error.message : 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const passwordStrength = {
    hasMinLength: formData.password.length >= 6,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumbers: /\d/.test(formData.password)
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  // ✅ Deshabilitar el formulario si estás offline
  const isFormDisabled = loading || !isOnline || !isPasswordStrong || formData.password !== formData.confirmPassword;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white">Registrar Usuario</h1>
          <p className="text-soleo-light mt-2">
            {isOnline 
              ? 'Crear nueva cuenta de administrador o cliente'
              : '⚠️ Modo offline: no puedes registrar usuarios sin conexión'
            }
          </p>
        </div>
      </div>

      {/* ✅ Mensaje de modo offline prominente */}
      {!isOnline && (
        <div className="bg-amber-600/20 border border-amber-600 text-amber-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5" />
            <span>Modo offline: conecta a internet para registrar nuevos usuarios</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-600/20 border border-red-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-600/20 border border-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Usuario */}
          <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
            <h3 className="text-lg font-bold text-soleo-yellow mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Tipo de Usuario
            </h3>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={!isOnline}
              className="w-full bg-soleo-dark border border-soleo-brown/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-soleo-yellow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ADMIN">Administrador</option>
              <option value="CLIENTE">Cliente</option>
            </select>
            <p className="text-soleo-light text-sm mt-2">
              {formData.role === 'ADMIN' 
                ? 'El administrador tendrá acceso completo al sistema' 
                : 'El cliente tendrá acceso limitado a funciones básicas'
              }
            </p>
          </div>

          {/* Información Personal */}
          <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
            <h3 className="text-lg font-bold text-soleo-yellow mb-4">Información Personal</h3>
            
            {/* Nombre */}
            <div className="space-y-2 mb-4">
              <label className="text-soleo-light text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ingresa el nombre completo"
                disabled={!isOnline}
                className="w-full bg-soleo-dark border border-soleo-brown/50 rounded-lg px-4 py-3 text-white placeholder-soleo-light focus:outline-none focus:ring-2 focus:ring-soleo-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-soleo-light text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@ejemplo.com"
                disabled={!isOnline}
                className="w-full bg-soleo-dark border border-soleo-brown/50 rounded-lg px-4 py-3 text-white placeholder-soleo-light focus:outline-none focus:ring-2 focus:ring-soleo-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
            <h3 className="text-lg font-bold text-soleo-yellow mb-4">Seguridad</h3>
            
            {/* Contraseña */}
            <div className="space-y-2 mb-4">
              <label className="text-soleo-light text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  disabled={!isOnline}
                  className="w-full bg-soleo-dark border border-soleo-brown/50 rounded-lg px-4 py-3 text-white placeholder-soleo-light focus:outline-none focus:ring-2 focus:ring-soleo-yellow pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-soleo-light hover:text-white"
                  disabled={!isOnline}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Indicador de fortaleza de contraseña */}
              {formData.password && isOnline && (
                <div className="space-y-2 mt-3">
                  <div className="text-soleo-light text-sm">Fortaleza de la contraseña:</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {passwordStrength.hasMinLength ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={passwordStrength.hasMinLength ? 'text-green-400' : 'text-red-400'}>
                        Mínimo 6 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordStrength.hasUpperCase ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={passwordStrength.hasUpperCase ? 'text-green-400' : 'text-red-400'}>
                        Una letra mayúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordStrength.hasLowerCase ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={passwordStrength.hasLowerCase ? 'text-green-400' : 'text-red-400'}>
                        Una letra minúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordStrength.hasNumbers ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={passwordStrength.hasNumbers ? 'text-green-400' : 'text-red-400'}>
                        Un número
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <label className="text-soleo-light text-sm">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                  disabled={!isOnline}
                  className="w-full bg-soleo-dark border border-soleo-brown/50 rounded-lg px-4 py-3 text-white placeholder-soleo-light focus:outline-none focus:ring-2 focus:ring-soleo-yellow pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-soleo-light hover:text-white"
                  disabled={!isOnline}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full bg-soleo-yellow text-soleo-text-dark py-3 px-6 rounded-lg hover:bg-amber-400 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            {loading 
              ? 'Registrando...' 
              : isOnline 
                ? `Registrar ${formData.role === 'ADMIN' ? 'Administrador' : 'Cliente'}`
                : 'Conéctate para registrar'}
          </button>
        </form>
      </div>

      {/* Información */}
      <div className="bg-blue-600/20 border border-blue-600 text-blue-200 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5" />
          <p className="font-bold">💡 Registro Seguro</p>
        </div>
        <p className="text-sm">
          {isOnline 
            ? 'Solo los administradores pueden registrar nuevos usuarios. Los nuevos administradores tendrán acceso completo al sistema, mientras que los clientes tendrán acceso limitado.'
            : 'Esta función requiere conexión a internet para funcionar.'
          }
        </p>
      </div>
    </div>
  );
}