import React from 'react';
import { 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  Mail, 
  Clock, 
  Shield, 
  Smartphone, 
  Database 
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'IA Predictiva',
      description: 'Algoritmos avanzados que predicen el mejor momento y contenido para cada mensaje según el comportamiento de tus usuarios.'
    },
    {
      icon: Users,
      title: 'Segmentación Inteligente',
      description: 'Crea audiencias dinámicas basadas en comportamiento, preferencias y engagement para maximizar el impacto.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Avanzado',
      description: 'Reportes detallados con insights accionables para optimizar tus campañas y mejorar el ROI.'
    },
    {
      icon: Zap,
      title: 'Automatización Total',
      description: 'Flujos de trabajo automatizados que se adaptan en tiempo real al comportamiento del usuario.'
    },
    {
      icon: Mail,
      title: 'Plantillas Dinámicas',
      description: 'Contenido personalizado automáticamente según los datos demográficos y comportamiento de cada usuario.'
    },
    {
      icon: Clock,
      title: 'Timing Óptimo',
      description: 'IA que determina el momento perfecto para enviar cada mensaje basado en patrones históricos.'
    },
    {
      icon: Shield,
      title: 'Deliverability Premium',
      description: 'Garantizamos que tus emails lleguen a la bandeja de entrada con nuestra tecnología anti-spam avanzada.'
    },
    {
      icon: Smartphone,
      title: 'Responsive Design',
      description: 'Emails que se ven perfectos en cualquier dispositivo, automáticamente optimizados para móvil.'
    },
    {
      icon: Database,
      title: 'CRM Integrado',
      description: 'Sincronización automática con tu CRM existente y herramientas de gestión de clientes.'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Características que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
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
              className="group bg-white p-6 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
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