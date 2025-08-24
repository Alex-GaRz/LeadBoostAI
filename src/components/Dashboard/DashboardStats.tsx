import React from 'react';
import { Users, UserPlus, Brain, ShoppingCart } from 'lucide-react';

const DashboardStats: React.FC = () => {
  const stats = [
    {
      title: 'Leads Totales',
      value: '1,234',
      icon: Users,
      color: '',
      bgColor: '',
      textColor: 'text-[#2d4792]'
    },
    {
      title: 'Nuevos este mes',
      value: '23',
      icon: UserPlus,
      color: '',
      bgColor: '',
      textColor: 'text-green-700'
    },
    {
      title: 'Optimizados por IA',
      value: '987',
      icon: Brain,
      color: '',
      bgColor: '',
      textColor: 'text-[#2d4792]'
    },
    {
      title: 'Compradores',
      value: '12',
      icon: ShoppingCart,
      color: '',
      bgColor: '',
      textColor: 'text-green-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-[#2d4792] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg" style={{ background: '#2d4792' }}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold" style={{ color: stat.textColor.replace('text-', '').replace('[#', '#').replace(']', '') }}>{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;