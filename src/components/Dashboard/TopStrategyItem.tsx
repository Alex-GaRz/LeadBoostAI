import React from 'react';
import { TrendingUp } from 'lucide-react';

interface TopStrategyItemProps {
  rank: number;
  strategyName: string;
  metric: string;
  roi: string;
}

const TopStrategyItem: React.FC<TopStrategyItemProps> = ({ rank, strategyName, metric, roi }) => {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-2">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 font-bold text-lg text-gray-700">{rank}</span>
        <div>
          <div className="font-semibold text-gray-900 text-base">{strategyName}</div>
          <div className="text-xs text-gray-500">{metric}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <span className="text-green-600 font-bold text-sm">ROI: {roi}</span>
      </div>
    </div>
  );
};

export default TopStrategyItem;
