// src/components/ClientLayout.tsx
import React, { useState, useEffect } from 'react';
import type { ClientView } from '../ClienteDashboard';
import { 
  Flame, Crown, BarChart3, User, Settings, LogOut, Award, Clock, 
  CheckCircle, XCircle, Heart 
} from 'lucide-react'; // 👈 Removido Wifi y WifiOff

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    membership: string;
    profilePhoto?: string;
    createdAt: string;
}

interface CurrentMembershipInfo {
    isActive: boolean;
    daysRemaining: number;
}

interface ClientLayoutProps {
    user: User;
    activeView: ClientView; // ✅
    onViewChange: (view: ClientView) => void; // ✅
    onLogout: () => void;
    children: React.ReactNode;
    membershipInfo?: CurrentMembershipInfo | null;
}

export function ClientLayout({ user, activeView, onViewChange, onLogout, children, membershipInfo }: ClientLayoutProps) {
  const [isGifHovered, setIsGifHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGifHovered(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getProfilePhotoUrl = (photoPath: string | undefined) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '');
    if (photoPath.startsWith('/uploads')) {
      return `${baseUrl}${photoPath}`;
    }
    return `${baseUrl}/uploads/profile/${photoPath}`;
  };

  const getMembershipColors = () => {
    switch (user.membership.toLowerCase()) {
      case 'composta':
        return { bg: 'bg-soleo-yellow', text: 'text-soleo-text-dark', border: 'border-soleo-yellow', status: membershipInfo?.isActive ? 'Activa' : 'Inactiva' };
      case 'sol':
        return { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', text: 'text-white', border: 'border-amber-500', status: membershipInfo?.isActive ? 'Activa' : 'Inactiva' };
      case 'semilla':
        return { bg: 'bg-soleo-brown/80', text: 'text-white', border: 'border-soleo-brown', status: 'Trial' };
      default:
        return { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-600', status: 'Sin info' };
    }
  };

  const membershipColors = getMembershipColors();

  const menuItems = [
    { id: 'dashboard', icon: Flame, label: 'Inicio' },
    { id: 'hoy', icon: Clock, label: 'Hoy' },
    { id: 'membresias', icon: Crown, label: 'Membresías' },
    { id: 'progreso', icon: BarChart3, label: 'Progreso' },
    { id: 'perfil', icon: User, label: 'Perfil' },
    { id: 'ajustes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* SIDEBAR DESKTOP */}
        <div className="hidden md:block w-64 bg-soleo-dark min-h-screen p-6 fixed left-0 top-0 overflow-y-auto z-30">
          <div className="mb-12">
            <div className={`w-20 h-20 ${membershipColors.bg} border-4 ${membershipColors.border} rounded-full flex items-center justify-center mx-auto overflow-hidden`}>
              {user.profilePhoto ? (
                <img 
                  src={getProfilePhotoUrl(user.profilePhoto) || ''}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : <Award className="w-10 h-10 text-white" />}
            </div>
            <h2 className="font-bold text-xl text-white text-center mt-4 truncate">
              {user.name}
            </h2>
            <p className="text-sm text-soleo-yellow text-center mt-2">
              Membresía {user.membership}
            </p>
            <div className="flex items-center justify-center mt-2 space-x-2">
              {membershipInfo?.isActive ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">
                {membershipColors.status}
                {membershipInfo?.daysRemaining && membershipInfo.daysRemaining > 0 && 
                  ` • ${membershipInfo.daysRemaining}d restantes`
                }
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                className={`flex items-center space-x-3 w-full p-4 rounded-lg transition-colors ${
                  activeView === item.id 
                    ? 'bg-soleo-yellow text-soleo-text-dark' 
                    : 'text-soleo-light hover:bg-soleo-brown/30 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="font-bold">{item.label}</span>
              </button>
            ))}
            
            <button 
              onClick={onLogout}
              className="flex items-center space-x-3 w-full p-4 rounded-lg text-soleo-light hover:bg-red-500/20 hover:text-red-300 mt-8"
            >
              <LogOut className="w-6 h-6" />
              <span className="font-bold">Salir</span>
            </button>
          </nav>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 md:ml-64">
          {/* Header Mobile */}
          <header className="bg-black border-b border-gray-800 p-4 md:hidden sticky top-0 z-20">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">¡Hola, {user.name}!</h1>
                <p className="text-sm text-gray-400">
                  {user.membership} • 
                  <span className={`ml-1 ${
                    membershipInfo?.isActive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {membershipColors.status}
                  </span>
                </p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-300"
                aria-label="Salir"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="p-6 pb-20 md:pb-6">
            {children}
          </main>

          {/* Navegación inferior en mobile */}
          <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 md:hidden z-40">
            <div className="flex justify-around p-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as any)}
                  className={`flex flex-col items-center p-2 rounded-lg min-w-16 ${
                    activeView === item.id ? 'text-soleo-yellow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* 🎁 GIF animado */}
      <div className="fixed right-6 z-50 bottom-20 md:bottom-6">
        <div 
          className={`relative transition-all duration-1000 ease-in-out ${
            isGifHovered ? 'scale-110 rotate-3' : 'scale-100 -rotate-2'
          }`}
          onMouseEnter={() => setIsGifHovered(true)}
          onMouseLeave={() => setIsGifHovered(false)}
        >
          <div className={`absolute inset-0 bg-amber-500 rounded-full blur-lg opacity-30 animate-pulse ${
            isGifHovered ? 'scale-125' : 'scale-100'
          } transition-all duration-1000`}></div>
          
          <div className={`relative bg-gradient-to-br from-amber-500 to-amber-700 p-1 rounded-2xl shadow-2xl border-4 border-amber-200 ${
            isGifHovered ? 'shadow-amber-400' : 'shadow-amber-300'
          } transition-all duration-500`}>
            <img 
              src="/images/soleo.gif" 
              alt="Soleo animado"
              className={`w-20 h-20 rounded-full object-cover transition-all duration-500 ${
                isGifHovered ? 'brightness-110' : 'brightness-100'
              }`}
              onError={(e) => {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = `w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-100 text-2xl border-4 border-amber-200 ${
                  isGifHovered ? 'scale-110' : 'scale-100'
                } transition-all duration-500`;
                fallbackDiv.innerHTML = '🌻';
                e.currentTarget.parentNode?.replaceChild(fallbackDiv, e.currentTarget);
              }}
            />
            
            {isGifHovered && (
              <div className="absolute -top-2 -right-2 animate-bounce">
                <div className="bg-amber-600 rounded-full p-1 shadow-lg">
                  <Heart className="w-4 h-4 text-amber-100 fill-amber-100" />
                </div>
              </div>
            )}
          </div>

          <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 bg-amber-800 text-amber-50 px-3 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 transition-opacity duration-300 ${
            isGifHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            ¡Sigue así! 🌻
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-amber-800"></div>
          </div>
        </div>

        <div className={`text-center mt-3 transition-all duration-500 ${
          isGifHovered ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
        }`}>
          <p className="text-xs text-amber-700 font-medium bg-amber-200 px-2 py-1 rounded-full">
            {isGifHovered ? '¡Tú puedes! 🌻' : 'Tu progreso'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClientLayout;