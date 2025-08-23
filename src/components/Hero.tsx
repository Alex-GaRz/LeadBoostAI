import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Mail, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
  <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Impulsa el crecimiento de tu e-commerce con{' '}
              <span className="text-transparent bg-clip-text" style={{ background: '#2d4792', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                campañas digitales y contenido impulsado por IA
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              Gestionamos y optimizamos tus campañas de Google Ads, Meta Ads y Email Marketing, creamos contenido atractivo (imágenes y videos) y analizamos a tu competencia para que vendas más y escales más rápido.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Comenzar Prueba Gratuita
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Dashboard Overview</h3>
                <span className="text-sm text-gray-500">Tiempo real</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Open Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">42.3%</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Click Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">8.4%</div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: '#e6eaf6' }}>
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4" style={{ color: '#2d4792' }} />
                  <span className="text-sm font-medium" style={{ color: '#2d4792' }}>Campañas Automatizadas</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#2d4792' }}>Active</div>
                <div className="w-full rounded-full h-2 mt-2" style={{ background: '#b3c0e6' }}>
                  <div className="h-2 rounded-full" style={{ width: '78%', background: '#2d4792' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;