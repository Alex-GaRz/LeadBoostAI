import React from 'react';
import { Title } from '@tremor/react';
import { ChatBubbleLeftRightIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface Signal {
  id: string;
  source: string;
  topic: string;
  sentiment: string;
  timestamp: string;
}

interface Props {
  signals: Signal[];
}

const IntelligenceFeed: React.FC<Props> = ({ signals }) => {
  return (
    <div className="bg-[#09090b] border border-slate-800 h-full flex flex-col">
      {/* Header del Panel */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <Title className="text-white font-mono text-sm uppercase flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Market Signals (B1)
        </Title>
        <span className="text-[10px] font-mono text-slate-500 border border-slate-700 px-2 py-0.5 rounded">
          LIVE FEED
        </span>
      </div>

      {/* Lista de Señales */}
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600">
            <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full mb-2"></div>
            <span className="text-xs font-mono">Scanning frequencies...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {signals.map((signal) => (
              <div key={signal.id} className="p-3 hover:bg-slate-800/30 transition-colors group">
                <div className="flex justify-between items-start mb-1">
                  {/* Badge de Fuente */}
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                    signal.source.includes('reddit') 
                      ? 'bg-orange-900/20 border-orange-900/50 text-orange-400' 
                      : 'bg-blue-900/20 border-blue-900/50 text-blue-400'
                  }`}>
                    {signal.source.includes('reddit') ? (
                      <ChatBubbleLeftRightIcon className="h-3 w-3" />
                    ) : (
                      <ArrowTrendingUpIcon className="h-3 w-3" />
                    )}
                    {signal.source}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-600 font-mono">
                    {new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Contenido */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                  {signal.topic}
                </p>

                {/* Sentimiento (Si aplica) */}
                {signal.sentiment === 'negative' && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-3/4"></div>
                    </div>
                    <span className="text-[9px] text-rose-500 font-mono uppercase">Negative Sentiment Detected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Status */}
      <div className="bg-slate-950 p-2 border-t border-slate-800 text-[10px] text-slate-600 font-mono text-center">
        Listening to: REDDIT_RSS, GOOGLE_TRENDS
      </div>
    </div>
  );
};

export default IntelligenceFeed;