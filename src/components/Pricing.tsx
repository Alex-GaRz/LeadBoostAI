import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Gratis',
      description: 'Ideal para probar funcionalidades y equipos pequeños',
      popular: false,
      features: [
        'Hasta 1,000 contactos',
        'Segmentación automática de audiencia',
        'Personalización de mensajes automática',
        'Analytics básicos',
        'Hasta 500 envíos/mes',
        'Campañas email simples',
        'Plantillas personalizadas y editor drag & drop',
        'Reportes básicos: open rates',
        'Soporte por email y chat'
      ]
    },
    {
      name: 'Pro',
      price: '29',
      description: 'Perfecto para negocios en crecimiento con marketing activo y gestión IA automatizada',
      popular: true,
      features: [
        'Todo lo del plan Starter, además:',
        'Hasta 10,000 contactos',
        'Campañas Avanzadas',
        'Automatización básica (drip emails)',
        'Campañas de re-engagement',
        'Recomendación de contenido adaptado',
        'Optimización automática de asuntos',
        'Integraciones externas: CRM - ecomm',
        'A/B testing avanzado / segmented',
        'API webhooks por otros SAAS',
        'Soporte prioritario por teléfono',
        'Reportes avanzados'
      ]
    },
    {
      name: 'Business',
      price: '299',
      description: 'Para empresas que necesitan características avanzadas, predictivo, multidominio y análisis profundo',
      popular: false,
      features: [
        'Todo lo del plan Pro, además:',
        'Hasta 100,000 contactos (configuración)',
        '8 campañas scoring intelligent',
        'Lead scoring automático',
        'Predictive churn analysis',
        'Reporting de contenido via optimizaciones',
        'Chat predition',
        'Optimización algoritmo de delivery avanzada',
        'API testing automático / predictivo',
        'Integraciones avanzadas con metabase',
        'Multiple y Advanced CRM intelligence',
        'Reportes y dashboards personalizados',
        'Integración personalizada',
        'AI para gestión de correos',
        'Onboarding guiado e consultoria inicial'
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planes que se adaptan a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              tu crecimiento
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comienza gratis y escala con nosotros. Planes flexibles con funcionalidades avanzadas de
            automatización e IA.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                plan.popular 
                  ? 'border-2 border-indigo-500 transform scale-105' 
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-semibold">Más Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 'Gratis' ? plan.price : `$${plan.price}`}
                  </span>
                  {plan.price !== 'Gratis' && (
                    <span className="text-gray-500 text-lg">/mes</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className={`w-full py-3 px-6 rounded-lg font-semibold text-center block transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.price === 'Gratis' ? 'Comenzar Gratis' : 'Comenzar Prueba'}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Aplicación de plan personalizado. Condiciones para configuración personalizada o volúmenes mayores.
          <br />
          Consulta nuestros términos y precios para más casos específicos.
        </p>
      </div>
    </section>
  );
};

export default Pricing;