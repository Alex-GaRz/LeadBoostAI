import React from 'react';
import AuthForm from '../components/AuthForm';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black">
      {/* Zona izquierda: Galería animada */}
      <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 relative overflow-hidden">
        <div className="w-[420px] h-[520px] flex items-center justify-center relative">
          <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center animate-slide">
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Ejemplo 1" className="rounded-xl shadow-lg w-full h-full object-cover opacity-80" />
          </div>
          <div className="absolute left-[-60px] top-8 w-[340px] h-[420px] flex items-center justify-center animate-slide-delay">
            <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Ejemplo 2" className="rounded-xl shadow-lg w-full h-full object-cover opacity-60" />
          </div>
          <div className="absolute left-[60px] top-16 w-[340px] h-[420px] flex items-center justify-center animate-slide-delay2">
            <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" alt="Ejemplo 3" className="rounded-xl shadow-lg w-full h-full object-cover opacity-60" />
          </div>
        </div>
      </div>
      {/* Zona derecha: Formulario Blindado */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 min-h-screen bg-white">
        <div className="w-full max-w-md px-6 py-8">
          <AuthForm type="login" />

          {/* PROTOCOLO WHITE GLOVE: MENSAJE DE EXCLUSIVIDAD */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
              Acceso Restringido
            </p>
            <p className="text-sm text-gray-600">
              Acceso exclusivo para socios Enterprise.<br/>
              Contacte a administración para credenciales.
            </p>
            {/* Nota visual: Si AuthForm tiene un enlace interno de registro, este mensaje clarifica que no está disponible públicamente */}
          </div>

        </div>
      </div>
      <style>{`
        @keyframes slide {
          0% { transform: scale(1) translateY(0); box-shadow: 0 0 24px #2563eb44; }
          50% { transform: scale(1.04) translateY(-10px); box-shadow: 0 0 32px #2563eb99; }
          100% { transform: scale(1) translateY(0); box-shadow: 0 0 24px #2563eb44; }
        }
        .animate-slide { animation: slide 3s infinite; }
        .animate-slide-delay { animation: slide 3s infinite 0.8s; }
        .animate-slide-delay2 { animation: slide 3s infinite 1.6s; }
      `}</style>
    </div>
  );
};

export default LoginPage;