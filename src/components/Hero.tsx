import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Mail, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
  <section className="bg-[#f7f8fa] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Impulsa el crecimiento de tu e-commerce con{' '}
              <span className="text-[#2563eb]">
                campañas digitales y contenido impulsado por IA
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              Gestionamos y optimizamos tus campañas de Google Ads, Meta Ads y Email Marketing, creamos contenido atractivo (imágenes y videos) y analizamos a tu competencia para que vendas más y escales más rápido.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 bg-[#2563eb] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors duration-200 shadow-md"
              >
                Comenzar Prueba Gratuita
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Dashboard Overview</h3>
                <span className="text-sm text-gray-500">Tiempo real</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-sm font-medium text-blue-900">Open Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-[#2563eb]">42.3%</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-sm font-medium text-blue-900">Click Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-[#2563eb]">8.4%</div>
                </div>
              </div>

              <div className="rounded-lg p-4 bg-blue-50 border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[#2563eb]" />
                  <span className="text-sm font-medium text-blue-900">Campañas Automatizadas</span>
                </div>
                <div className="text-2xl font-bold text-[#2563eb]">Active</div>
                <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
                  <div className="bg-[#2563eb] h-2 rounded-full" style={{ width: '78%' }}></div>
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