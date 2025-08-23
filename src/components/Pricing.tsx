import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Gratis',
      description: 'Perfecto para probar la plataforma y empezar con campañas básicas.',
      popular: false,
      features: [
        '1 campaña activa (elige entre Google Ads, Meta Ads o Email Marketing)',
        '500 envíos de email/mes',
        '1 plantilla de contenido (imagen estándar)',
        'Reporte básico de rendimiento',
        'Acceso a dashboard con métricas esenciales',
        'Ideal para pequeñas tiendas que quieren probar sin compromiso.'
      ]
    },
    {
      name: 'Pro',
      price: '99',
      description: 'El plan más popular, diseñado para e-commerce en crecimiento.',
      popular: true,
      features: [
        'Incluye todo en Starter, más:',
        'Hasta 5 campañas activas (multicanal: Google Ads + Meta Ads + Email Marketing)',
        '10,000 envíos de email/mes',
        '10 plantillas de contenido (imágenes optimizadas para anuncios)',
        '2 videos cortos publicitarios/mes',
        'Reportes avanzados + insights de optimización con IA',
        'Análisis básico de competencia (benchmarks y sugerencias de mejora)',
        'Soporte prioritario por chat',
        'Ideal para marcas de Shopify y e-commerce que buscan aumentar ventas de forma constante.'
      ]
    },
    {
      name: 'Business',
      price: '499',
      description: 'Para empresas que necesitan gestión avanzada y escalado completo.',
      popular: false,
      features: [
        'Incluye todo en Pro, más:',
        'Campañas ilimitadas en todas las plataformas',
        '100,000 envíos de email/mes',
        'Contenido premium: 30 imágenes y 5 videos/mes',
        'Investigación de mercado y análisis completo de la competencia',
        'Optimización personalizada con estratega dedicado',
        'Reportes avanzados + reuniones mensuales de consultoría',
        'Soporte 24/7 con account manager',
        'Pensado para empresas en expansión que quieren escalar agresivamente y superar a la competencia.'
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planes que se adaptan a{' '}
            <span className="text-transparent bg-clip-text" style={{ background: '#2d4792', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
                  ? 'border-2 transform scale-105' 
                  : 'border border-gray-200'
              }`}
              style={plan.popular ? { borderColor: '#2d4792' } : {}}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="text-white px-4 py-1 rounded-full flex items-center space-x-1" style={{ background: '#2d4792' }}>
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
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                style={plan.popular ? { background: '#2d4792' } : {}}
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