import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';

// 🔥 Firebase
import { messaging } from '../../../lib/firebase';
import { getToken } from 'firebase/messaging';
import { api } from '../../../api'; // tu instancia de Axios o fetch wrapper

const ClientSettings: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [activeLegalView, setActiveLegalView] = useState<'main' | 'privacy' | 'terms' | 'security'>('main');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationsEnabled') === 'true';
    const savedMarketing = localStorage.getItem('marketingEnabled') === 'true';
    setNotificationsEnabled(savedNotifications);
    setMarketingEnabled(savedMarketing);
  }, []);

  // 🔥 Nueva lógica: FCM (Firebase)
  const requestNotificationPermission = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Notificaciones no soportadas en este navegador.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Permiso denegado.');
        return;
      }

      const fcmToken = await getToken(messaging, {
        vapidKey: 'BD1sxeZ9qGmNT_OQbjK2IOj4TR1ZnltMoRfN-9VLmx4gYowBG5cX96Kb9UINnZt2UytiU55T_n0cAZyfbrcjK50' // tu apiKey de Firebase
      });

      if (!fcmToken) {
        console.error('No se pudo obtener el token FCM.');
        return;
      }

      // Enviar al backend
      await api.post('/users/fcm-token', { fcmToken });
      console.log('✅ Token FCM registrado en el servidor');
    } catch (error) {
      console.error('❌ Error al registrar FCM:', error);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
    
    if (enabled) {
      setIsSubscribing(true);
      await requestNotificationPermission();
      setIsSubscribing(false);
    }
  };

  const handleMarketingToggle = (enabled: boolean) => {
    setMarketingEnabled(enabled);
    localStorage.setItem('marketingEnabled', enabled.toString());
  };

  // === Contenido Legal (sin cambios) ===
  const PrivacyPolicyContent = () => (
    <>
      <h1 className="text-2xl font-bold text-amber-100 mb-6">Política de Privacidad</h1>
      <div className="space-y-4 text-amber-200 leading-relaxed">
        <p><strong>Última actualización:</strong> 26 de noviembre de 2025</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">1. Información que recopilamos</h2>
        <p>Recopilamos información personal como tu nombre, correo electrónico, peso, historial de entrenamientos y preferencias para personalizar tu experiencia en Sóleo.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">2. Cómo utilizamos tu información</h2>
        <p>Utilizamos tus datos para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Proporcionar y personalizar tu plan de entrenamiento</li>
          <li>Mejorar nuestras rutinas y funcionalidades</li>
          <li>Enviarte notificaciones relevantes (si las autorizas)</li>
          <li>Cumplir con obligaciones legales y fiscales</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">3. Tus derechos ARCO</h2>
        <p>Tienes derecho a acceder, rectificar, cancelar u oponerte al uso de tus datos personales. Para ejercer estos derechos, contacta a:</p>
        <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30 mt-2">
          <p className="font-medium">Email: privacidad@ion-tech.mx</p>
          <p>iON-TECH - Universidad Tecnológica de Jalisco</p>
        </div>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">4. Seguridad de tus datos</h2>
        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra accesos no autorizados, alteración, divulgación o destrucción.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">5. Cambios en esta política</h2>
        <p>Nos reservamos el derecho de actualizar esta política. Los cambios entrarán en vigor inmediatamente tras su publicación en la aplicación.</p>
      </div>
    </>
  );

  const TermsOfServiceContent = () => (
    <>
      <h1 className="text-2xl font-bold text-amber-100 mb-6">Términos de Servicio</h1>
      <div className="space-y-4 text-amber-200 leading-relaxed">
        <p><strong>Última actualización:</strong> 26 de noviembre de 2025</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">1. Uso adecuado de la aplicación</h2>
        <p>La aplicación Sóleo está diseñada con fines informativos. <strong>No sustituye la asesoría de un entrenador profesional ni de un especialista en salud física.</strong> El uso de esta aplicación es bajo tu propia responsabilidad.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">2. Responsabilidad del usuario</h2>
        <p>Eres responsable de realizar los ejercicios de forma correcta y adaptada a tus condiciones físicas actuales. Sóleo <strong>no se hace responsable</strong> por lesiones, molestias o daños derivados de una ejecución inadecuada de las rutinas propuestas.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">3. Consulta médica obligatoria</h2>
        <p><strong>Recomendamos encarecidamente</strong> que consultes con un médico o profesional de la salud antes de iniciar cualquier plan de ejercicio, especialmente si padeces alguna condición médica, lesión previa o estás embarazada.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">4. Prohibición de uso indebido</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Modificar, descompilar o realizar ingeniería inversa del código</li>
          <li>Distribuir, vender o usar comercialmente la aplicación sin autorización</li>
          <li>Utilizar la app para fines ilegales o dañinos</li>
          <li>Crear cuentas falsas o suplantar la identidad de otros</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">5. Actualizaciones y mejoras</h2>
        <p>Sóleo podrá actualizar rutinas, funciones o políticas de uso sin previo aviso, con el fin de mejorar la experiencia del usuario y garantizar la seguridad de la aplicación.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">6. Jurisdicción aplicable</h2>
        <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa se resolverá ante los tribunales competentes del estado de Jalisco, México.</p>
      </div>
    </>
  );

  const SecurityPolicyContent = () => (
    <>
      <h1 className="text-2xl font-bold text-amber-100 mb-6">Seguridad de la Información</h1>
      <div className="space-y-4 text-amber-200 leading-relaxed">
        <p><strong>Última actualización:</strong> 26 de noviembre de 2025</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">1. Nuestro compromiso</h2>
        <p>En Sóleo nos tomamos muy en serio la seguridad de tus datos personales. Hemos implementado un programa integral de gestión de la seguridad de la información basado en estándares internacionales.</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">2. Medidas de seguridad implementadas</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Cifrado de datos:</strong> Todos tus datos están cifrados tanto en tránsito (HTTPS/TLS) como en reposo (AES-256)</li>
          <li><strong>Autenticación segura:</strong> Sistema de autenticación robusto con tokens JWT</li>
          <li><strong>Copias de seguridad:</strong> Backups diarios de toda la información crítica</li>
          <li><strong>Monitoreo continuo:</strong> Detección y prevención de intrusiones 24/7</li>
          <li><strong>Actualizaciones de seguridad:</strong> Mantenimiento proactivo de dependencias y librerías</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">3. Protección contra brechas de seguridad</h2>
        <p>En caso de que ocurra una brecha de seguridad que comprometa tus datos personales, te notificaremos dentro de las 72 horas siguientes al descubrimiento del incidente, tal como lo establece la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">4. Cumplimiento normativo</h2>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</li>
          <li>Estándares internacionales ISO/IEC 27001</li>
          <li>Mejores prácticas de la industria en ciberseguridad</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-amber-100 mt-6 mb-3">5. Contacto para incidentes de seguridad</h2>
        <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30 mt-2">
          <p className="font-medium">Email de seguridad: seguridad@ion-tech.mx</p>
          <p>Reporta cualquier vulnerabilidad o incidente de seguridad</p>
        </div>
      </div>
    </>
  );

  // === Renderizado ===
  if (activeLegalView !== 'main') {
    return (
      <div className="min-h-screen bg-black text-amber-100 p-4 sm:p-6">
        <button 
          onClick={() => setActiveLegalView('main')}
          className="mb-6 flex items-center gap-2 text-amber-300 hover:text-amber-100"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver a Configuración
        </button>
        
        <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30">
          {activeLegalView === 'privacy' && <PrivacyPolicyContent />}
          {activeLegalView === 'terms' && <TermsOfServiceContent />}
          {activeLegalView === 'security' && <SecurityPolicyContent />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-amber-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
          <p className="text-amber-300 mt-2">
            Administra tus preferencias y configuración de la aplicación
          </p>
        </div>
        
        {/* Notificaciones */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-amber-900/30">
          <h2 className="text-xl font-semibold text-amber-100 mb-4">Preferencias de Notificaciones</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-amber-100">Notificaciones Push</h3>
                <p className="text-amber-300 text-sm mt-1">
                  Recibe notificaciones sobre tus entrenamientos, recordatorios y actualizaciones importantes
                </p>
              </div>
              <button
                onClick={() => handleNotificationsToggle(!notificationsEnabled)}
                disabled={isSubscribing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-amber-600' : 'bg-amber-900/50'
                } ${isSubscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubscribing ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin mx-auto" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-amber-100">Información y Promociones</h3>
                <p className="text-amber-300 text-sm mt-1">
                  Recibe información sobre nuevos features, promociones y contenido educativo
                </p>
              </div>
              <button
                onClick={() => handleMarketingToggle(!marketingEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  marketingEnabled ? 'bg-amber-600' : 'bg-amber-900/50'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    marketingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Créditos */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-amber-900/30">
          <h2 className="text-xl font-semibold text-amber-100 mb-6">Créditos</h2>
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="font-medium text-amber-100 mb-4">Desarrollado por</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <img 
                  src="/images/creditos.png" 
                  alt="iON-TECH" 
                  className="h-16 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-amber-100 mb-4 text-center">Equipo de Desarrollo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
                  <p className="font-medium text-amber-100"></p>
                  <p className="text-amber-300 text-sm">Brenda Esquivel</p>
                </div>
                <div className="text-center p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
                  <p className="font-medium text-amber-100"></p>
                  <p className="text-amber-300 text-sm">Jorge Torres</p>
                </div>
                <div className="text-center p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
                  <p className="font-medium text-amber-100"></p>
                  <p className="text-amber-300 text-sm">Paulette Guzmán</p>
                </div>
                <div className="text-center p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
                  <p className="font-medium text-amber-100"></p>
                  <p className="text-amber-300 text-sm">Eduardo Cantor</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-medium text-amber-100 mb-4">En colaboración con</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <img 
                  src="/images/utj.png" 
                  alt="UTJ" 
                  className="h-12 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <p className="font-semibold text-amber-100"></p>
                  <p className="text-amber-300 text-sm">Formando profesionales de excelencia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-amber-900/30">
          <h2 className="text-xl font-semibold text-amber-100 mb-4">Información Legal</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setActiveLegalView('privacy')}
              className="w-full text-left p-4 hover:bg-amber-900/20 rounded-lg transition-colors border border-amber-900/30"
            >
              <h3 className="font-medium text-amber-100">Política de Privacidad</h3>
              <p className="text-amber-300 text-sm mt-1">Cómo protegemos y utilizamos tu información personal</p>
            </button>

            <button 
              onClick={() => setActiveLegalView('terms')}
              className="w-full text-left p-4 hover:bg-amber-900/20 rounded-lg transition-colors border border-amber-900/30"
            >
              <h3 className="font-medium text-amber-100">Términos de Servicio</h3>
              <p className="text-amber-300 text-sm mt-1">Condiciones de uso de nuestra aplicación</p>
            </button>

            <button 
              onClick={() => setActiveLegalView('security')}
              className="w-full text-left p-4 hover:bg-amber-900/20 rounded-lg transition-colors border border-amber-900/30"
            >
              <h3 className="font-medium text-amber-100">Seguridad</h3>
              <p className="text-amber-300 text-sm mt-1">Medidas de seguridad implementadas para proteger tus datos</p>
            </button>
          </div>
        </div>

        {/* Versión */}
        <div className="text-center pt-6 border-t border-amber-900/30">
          <p className="text-amber-400 text-sm">
            Versión 1.0.0 • iON-TECH © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;