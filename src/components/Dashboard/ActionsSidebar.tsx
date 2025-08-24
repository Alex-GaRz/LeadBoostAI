import React from 'react';
import { List, Plus, Settings, LogOut } from 'lucide-react';
import { signOut } from '../../firebase/authService';
import { useNavigate } from 'react-router-dom';

const ActionsSidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const actions = [
    {
      title: 'Ver Todos los Leads',
      icon: List,
      onClick: () => console.log('Ver todos los leads'),
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      title: 'Crear Campaña',
      icon: Plus,
      onClick: () => console.log('Crear campaña'),
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Configuración',
      icon: Settings,
      onClick: () => console.log('Configuración'),
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2d4792' }}>Acciones Rápidas</h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`w-full flex items-center justify-center px-4 py-3 font-medium rounded-lg transition-colors`}
            style={{ background: index === 0 ? '#2d4792' : index === 1 ? '#22c55e' : '#64748b', color: '#fff' }}
          >
            <action.icon className="w-5 h-5 mr-2" />
            {action.title}
          </button>
        ))}
        
        <hr className="my-4" />
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center px-4 py-3 font-medium rounded-lg transition-colors"
          style={{ background: '#fff', color: '#e11d48', border: '1px solid #e11d48' }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Resumen Semanal</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Nuevos Generados</span>
            <span className="font-medium">6,4%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Leads Calificados</span>
            <span className="font-medium">78%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ROI Campaigns</span>
            <span className="font-medium">2,34x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsSidebar;