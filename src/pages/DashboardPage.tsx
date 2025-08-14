import React from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardStats from '../components/Dashboard/DashboardStats';
import LeadsTable from '../components/Dashboard/LeadsTable';
import ActionsSidebar from '../components/Dashboard/ActionsSidebar';
import { Calendar } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                 Hola, {profile?.companyName || 'Usuario'} 👋
              </h1>
              <div className="flex items-center mt-2 text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="capitalize">{currentDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <LeadsTable />
          </div>
          <div>
            <ActionsSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;