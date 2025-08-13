import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Mail, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Automatiza tus campañas de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                email marketing
              </span>{' '}
              con IA
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              Aumenta tus conversiones hasta un 300% con nuestra plataforma de 
              automatización inteligente que personaliza cada mensaje según el 
              comportamiento de tus usuarios.
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

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Campañas Automatizadas</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">Active</div>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
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