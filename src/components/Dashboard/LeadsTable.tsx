import React from 'react';
import { Eye, Calendar } from 'lucide-react';

interface Lead {
  id: number;
  name: string;
  company: string;
  score: string;
  scoreColor: string;
  date: string;
}

const LeadsTable: React.FC = () => {
  const leads: Lead[] = [
    {
      id: 1,
      name: 'Mario Garcia',
      company: 'TechCorp',
      score: 'Buena',
      scoreColor: 'bg-green-100 text-green-800',
      date: '15/11/2024'
    },
    {
      id: 2,
      name: 'Carlos Rodriguez',
      company: 'StartupInc',
      score: 'IDEAL',
      scoreColor: 'bg-purple-100 text-purple-800',
      date: '14/11/2024'
    },
    {
      id: 3,
      name: 'Ana López',
      company: 'BusinessCo',
      score: 'Media',
      scoreColor: 'bg-yellow-100 text-yellow-800',
      date: '13/11/2024'
    },
    {
      id: 4,
      name: 'Roberto Silva',
      company: 'Enterprise Ltd',
      score: 'Buena',
      scoreColor: 'bg-green-100 text-green-800',
      date: '12/11/2024'
    },
    {
      id: 5,
      name: 'Laura Mendoza',
      company: 'InnovateNow',
      score: 'IDEAL',
      scoreColor: 'bg-purple-100 text-purple-800',
      date: '11/11/2024'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Últimos Leads</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre/Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calificación IA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.company}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.scoreColor}`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {lead.date}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;