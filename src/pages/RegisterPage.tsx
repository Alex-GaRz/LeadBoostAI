import React from 'react';
import AuthForm from '../components/AuthForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black">
      {/* Zona izquierda: Galería animada y espacio para ejemplos */}
      <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 relative overflow-hidden">
        {/* Carrusel animado de imágenes (placeholder) */}
        <div className="w-[420px] h-[520px] flex items-center justify-center relative">
          {/* Aquí puedes reemplazar los src por tus ejemplos reales */}
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
        {/* Espacio para subir ejemplos personalizados */}
        <div className="mt-8 w-[420px] h-24 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg bg-black/40 text-gray-400 text-center text-sm">
          Aquí podrás subir tus ejemplos personalizados
        </div>
      </div>
      {/* Zona derecha: Formulario */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 min-h-screen bg-white">
        <div className="w-full max-w-md px-0 py-0 bg-white">
          <AuthForm type="register" />
        </div>
      </div>
      {/* Animaciones CSS para el carrusel */}
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

export default RegisterPage;