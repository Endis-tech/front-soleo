import { Link } from 'react-router-dom';
import { CheckCircle, Target, Flower, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

// Banner Carousel Component
const WelcomeBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const banners = [
    '/images/baner1.png',
    '/images/baner2.png', 
    '/images/baner3.png'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl">
      {/* Banner Container */}
      <div 
        className="relative w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            <img 
              src={banner} 
              alt={`Banner de bienvenida ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay para mejor legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-soleo-dark/70 to-transparent"></div>
            
            {/* Texto sobre el banner */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                  {index === 0 && "Transforma tu rutina"}
                  {index === 1 && "Supera tus límites"}
                  {index === 2 && "Construye el hábito"}
                </h2>
                <p className="text-sm md:text-base opacity-90">
                  {index === 0 && "Comienza tu viaje fitness con Sóleo"}
                  {index === 1 && "Logra tus metas con nuestro sistema de rachas"}
                  {index === 2 && "Mantén la motivación día a día"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-soleo-yellow w-6' 
                : 'bg-white/50 hover:bg-white'
            }`}
            aria-label={`Ir al banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export function LandingPage() {
  return (
    <div className="bg-soleo-dark text-soleo-light font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-soleo-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4 flex justify-between items-center">
        
          <div className="flex items-center space-x-2">
            <img src="/images/soleo.png" alt="Sóleo Logo" className="w-20 md:w-24" />
            <span className="font-heading text-2xl md:text-3xl font-bold text-white">SÓLEO</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-soleo-light hover:text-soleo-yellow transition-colors">Características</a>
            <a href="#plans" className="text-soleo-light hover:text-soleo-yellow transition-colors">Planes</a>
            <a href="#contact" className="text-soleo-light hover:text-soleo-yellow transition-colors">Contacto</a>
            <Link 
              to="/login" 
              className="bg-soleo-yellow text-soleo-text-dark font-bold font-heading px-5 py-2 rounded-full hover:bg-yellow-400 transition-colors"
            >
              Empezar Ahora
            </Link>
          </nav>
          
          <div className="md:hidden">
            <Link 
              to="/login" 
              className="bg-soleo-yellow text-soleo-text-dark font-bold font-heading px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors text-sm"
            >
              Empezar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-soleo-dark">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              No rompas tu <span className="text-soleo-yellow">racha.</span>
            </h1>
            <p className="text-lg md:text-xl text-soleo-light max-w-3xl mx-auto mb-8">
              La app de fitness que te motiva a mantener la constancia y ver resultados reales.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center bg-soleo-yellow text-soleo-text-dark font-bold font-heading px-8 py-4 text-lg rounded-full hover:bg-yellow-400 transition-colors shadow-lg shadow-soleo-yellow/20"
            >
              Comienza ahora <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Banner */}
      <section className="py-8 md:py-12 bg-soleo-dark">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
              Bienvenido a tu nueva rutina
            </h2>
            <p className="text-soleo-light">
              Descubre cómo Sóleo puede transformar tu forma de entrenar
            </p>
          </div>
          <WelcomeBanner />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-soleo-dark/95">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-soleo-yellow font-bold font-heading">¿POR QUÉ SÓLEO?</span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mt-2">
              Construye tu constancia.
            </h2>
            <p className="text-lg text-soleo-light max-w-2xl mx-auto mt-4">
              Todo lo que necesitas para mantener la motivación y ver tu progreso.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-soleo-brown p-6 md:p-8 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-soleo-yellow/10 rounded-lg flex items-center justify-center mb-5">
                <CheckCircle className="w-6 h-6 text-soleo-yellow" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-2">Sistema de Rachas</h3>
              <p className="text-soleo-light">
                Mantén tu fuego encendido. Te motivamos a no faltar ningún día con un sistema de rachas diarias que te da EXP y recompensas.
              </p>
            </div>
            
            <div className="bg-soleo-brown p-6 md:p-8 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-soleo-yellow/10 rounded-lg flex items-center justify-center mb-5">
                <Flower className="w-6 h-6 text-soleo-yellow" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-2">Planes "Semilla" y "Composta"</h3>
              <p className="text-soleo-light">
                Empieza con lo básico (Semilla) o nutre tu entrenamiento con rutinas personalizadas y avanzadas (Composta).
              </p>
            </div>
            
            <div className="bg-soleo-brown p-6 md:p-8 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-soleo-yellow/10 rounded-lg flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-soleo-yellow" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-2">Modos de Entrenamiento</h3>
              <p className="text-soleo-light">
                Ya sea "Bulking" para crecer, "Cardio" ligero o "Zen" con yoga, tenemos un modo para tu meta del día.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-16 md:py-24 bg-soleo-dark">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-soleo-yellow font-bold font-heading">PLANES</span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mt-2">
              Elige tu forma de crecer.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Plan Semilla */}
            <div className="bg-soleo-brown/50 border-2 border-soleo-brown rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-white">Semilla 🌱</h3>
              <p className="text-soleo-light mt-2 mb-6 flex-grow">
                Para quienes dan su primer paso. Empieza a construir el hábito, sin compromiso.
              </p>
              <span className="text-3xl md:text-4xl font-bold text-white mb-2">Gratis</span>
              <p className="text-soleo-light text-sm mb-6">Sin tarjeta, sin riesgo</p>
              <ul className="mb-6 space-y-3 flex-grow">
                <li className="flex items-start">
                  <span className="text-soleo-yellow mr-2">✓</span>
                  <span className="text-soleo-light text-sm">Registro con nombre y correo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-yellow mr-2">✓</span>
                  <span className="text-soleo-light text-sm">Rutinas básicas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-yellow mr-2">✓</span>
                  <span className="text-soleo-light text-sm">Seguimiento de racha diaria</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-yellow mr-2">✓</span>
                  <span className="text-soleo-light text-sm">Acumulación de puntos EXP</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-yellow mr-2">✓</span>
                  <span className="text-soleo-light text-sm">Animaciones 2D de Sóleo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-yellow mr-2">✓</span>
                  <span className="text-soleo-light text-sm">1 notificación diaria fija</span>
                </li>
              </ul>
              <Link to="/register" className="w-full text-center bg-soleo-brown text-white font-bold font-heading px-6 py-3 rounded-full hover:bg-soleo-brown/70 transition-colors">
                Empezar Gratis
              </Link>
            </div>
            
            {/* Plan Composta */}
            <div className="bg-soleo-yellow rounded-2xl p-6 md:p-8 flex flex-col shadow-lg shadow-soleo-yellow/20">
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-soleo-text-dark">Composta 🌿</h3>
              <p className="text-soleo-text-dark/80 mt-2 mb-6 flex-grow">
                Para quienes van en serio. Entrena con un plan hecho para ti, en casa o en el gym.
              </p>
              <span className="text-3xl md:text-4xl font-bold text-soleo-text-dark mb-2">$90 <span className="text-lg">MXN/mes</span></span>
              <p className="text-soleo-text-dark/80 text-sm mb-6">Todo lo de Semilla, más:</p>
              <ul className="mb-6 space-y-3 flex-grow">
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Rutinas personalizadas según tu objetivo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Acceso completo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Entrenamiento en casa o gym</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Dashboard de progreso completo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Notificaciones en tus horarios</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Comunidad "Raíces Conectadas"</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Comparte progreso en redes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-soleo-text-dark mr-2">✓</span>
                  <span className="text-soleo-text-dark/80 text-sm">Soporte básico</span>
                </li>
              </ul>
              <Link to="/register" className="w-full text-center bg-soleo-dark text-white font-bold font-heading px-6 py-3 rounded-full hover:bg-black transition-colors">
                Elegir Composta
              </Link>
            </div>
            
            {/* Plan Sol */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="text-center p-4">
                  <div className="inline-block bg-amber-500 text-white font-bold font-heading px-4 py-2 rounded-full mb-4 animate-pulse">
                    ⏳ Próximamente
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">¡Ya casi!</h3>
                  <p className="text-white/80 text-sm">
                    Estamos trabajando en características premium.
                  </p>
                </div>
              </div>
              
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-white/70">Sol 🌞</h3>
              <p className="text-white/60 mt-2 mb-6 flex-grow">
                Para quienes ya no solo entrenan… inspiran.
              </p>
              <span className="text-3xl md:text-4xl font-bold text-white/50 mb-2">$9.99 <span className="text-lg">USD/mes</span></span>
              <p className="text-white/60 text-sm mb-6">Todo lo de Composta, más:</p>
              <ul className="mb-6 space-y-3 flex-grow">
                <li className="flex items-start">
                  <span className="text-white/40 mr-2">✓</span>
                  <span className="text-white/50 text-sm">Motivación desde expertos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white/40 mr-2">✓</span>
                  <span className="text-white/50 text-sm">Asistentes personalizados 24/7</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white/40 mr-2">✓</span>
                  <span className="text-white/50 text-sm">Coach virtual avanzado</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white/40 mr-2">✓</span>
                  <span className="text-white/50 text-sm">Plan de alimentación</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white/40 mr-2">✓</span>
                  <span className="text-white/50 text-sm">Seguimiento nutricional</span>
                </li>
              </ul>
              <button 
                disabled 
                className="w-full text-center bg-gray-500 text-gray-300 font-bold font-heading px-6 py-3 rounded-full cursor-not-allowed"
              >
                Disponible Pronto
              </button>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <p className="text-soleo-light text-sm">
              💳 Pagos mensuales mediante PayPal. Cancela cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-soleo-dark/95">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">¿Dudas o Sugerencias?</h2>
          <p className="text-lg text-soleo-light mb-8">
            Somos IONTECH, un equipo listo para ayudarte.
          </p>
          <a 
            href="mailto:contacto@iontech.com"
            className="inline-block bg-soleo-yellow text-soleo-text-dark font-bold font-heading px-8 py-4 text-lg rounded-full hover:bg-yellow-400 transition-colors"
          >
            contacto@iontech.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-soleo-dark border-t border-soleo-brown/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
          <div className="md:flex md:justify-between md:items-center mb-8">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <img src="/images/soleo.png" alt="Sóleo Logo" className="w-12" />
              <span className="font-heading text-2xl font-bold text-white">SÓLEO</span>
            </div>
            
            <div className="flex justify-center space-x-6 mb-6 md:mb-0">
              <a href="#features" className="text-soleo-light hover:text-white transition-colors">Características</a>
              <a href="#plans" className="text-soleo-light hover:text-white transition-colors">Planes</a>
              <a href="#contact" className="text-soleo-light hover:text-white transition-colors">Contacto</a>
            </div>
            
            <div>
              <Link 
                to="/login" 
                className="inline-block bg-soleo-yellow text-soleo-text-dark font-bold font-heading px-5 py-2 rounded-full hover:bg-yellow-400 transition-colors"
              >
                Empezar Ahora
              </Link>
            </div>
          </div>
          
          <div className="text-center text-sm text-soleo-light/70">
            <h4 className="font-bold text-base text-soleo-light mb-2">Políticas de Uso</h4>
            <p className="mb-4">
              Sóleo es una herramienta de seguimiento. IONTECH no se hace responsable por lesiones o daños ocasionados por realizar incorrectamente los ejercicios o rutinas. Consulta a un profesional antes de empezar cualquier régimen de ejercicio.
            </p>
            <div className="text-soleo-light">
              © {new Date().getFullYear()} IONTECH. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}