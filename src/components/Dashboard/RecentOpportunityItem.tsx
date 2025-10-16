import React from 'react';
import { Link } from 'react-router-dom';

interface Opportunity {
  name: string;
  strategy: string;
  signal: string;
  strategyColor: string;
}

interface RecentOpportunityItemProps {
  opportunity: Opportunity;
}

const RecentOpportunityItem: React.FC<RecentOpportunityItemProps> = ({ opportunity }) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg shadow mb-2">
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900 text-base mb-1">{opportunity.name}</span>
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mr-2 mb-1 ${opportunity.strategyColor}`}>{opportunity.strategy}</span>
        <span className="text-gray-700 text-sm">Señal: "{opportunity.signal}"</span>
      </div>
      <Link to="/details" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">Ver Detalles</Link>
    </div>
  );
};

export default RecentOpportunityItem;
