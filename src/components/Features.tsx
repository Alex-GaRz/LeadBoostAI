import React from 'react';
import { 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  Mail
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Mail,
      title: 'Campañas Multicanal Inteligentes',
      description: 'Publicidad en Google Ads, Meta Ads y Email Marketing, gestionada con IA para maximizar conversiones.'
    },
    {
      icon: Brain,
      title: 'IA Predictiva y Optimización',
      description: 'Algoritmos que identifican el mejor momento, audiencia y mensaje para tus anuncios y correos.'
    },
    {
      icon: BarChart3,
      title: 'Contenido que Vende',
      description: 'Imágenes y videos diseñados para captar la atención y aumentar CTR en anuncios de e-commerce (Shopify).'
    },
    {
      icon: Users,
      title: 'Investigación de Competencia',
      description: 'Análisis detallado de lo que hacen tus competidores para encontrar oportunidades y mejorar tus resultados.'
    },
    {
      icon: Zap,
      title: 'Automatización Inteligente',
      description: 'Flujos de trabajo que optimizan presupuesto, segmentación y remarketing en tiempo real.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Avanzado',
      description: 'Reportes claros con insights accionables para escalar tus campañas y mejorar el ROI.'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Características que{' '}
            <span className="text-transparent bg-clip-text" style={{ background: '#2d4792', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              impulsan resultados
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nuestra plataforma combina lo mejor de la inteligencia artificial con herramientas
            probadas de marketing para maximizar el impacto de cada campaña.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300"
              style={{ borderColor: '#2d4792' }}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200" style={{ background: '#2d4792' }}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;