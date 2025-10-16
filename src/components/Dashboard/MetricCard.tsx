import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  comparisonText?: string;
  comparisonColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, comparisonText, comparisonColor }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start min-w-[220px]">
      <div className="text-xs font-semibold text-gray-500 mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {comparisonText && (
        <div className={`text-xs mt-1 ${comparisonColor || 'text-gray-400'}`}>{comparisonText}</div>
      )}
    </div>
  );
};

export default MetricCard;
