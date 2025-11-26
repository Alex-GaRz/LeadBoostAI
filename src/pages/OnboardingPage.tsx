import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, Search, BarChart2, CheckCircle, AlertTriangle, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// NOTA: Eliminamos la importación de DashboardLayout porque App.tsx ya provee el EnterpriseLayout
// import DashboardLayout from '../components/Dashboard/DashboardLayout'; <--- BORRADO

const BFF_URL = "http://localhost:8000";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStatus();
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BFF_URL}/onboarding/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) { 
      console.error("Error cargando estado:", e); 
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    const mockToken = prompt(`[SISTEMA SEGURO] Ingrese Access Token para ${platform}:`, "EAAG_TEST_TOKEN...");
    if (!mockToken || !user) return;

    setStatus((prev: any) => ({...prev, [platform]: 'connecting'}));

    const token = await user.getIdToken();
    try {
      const res = await fetch(`${BFF_URL}/onboarding/connect/${platform}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          platform,
          access_token: mockToken,
          account_id: `act_${Math.floor(Math.random()*10000)}`
        })
      });
      
      if (res.ok) {
        setTimeout(loadStatus, 1000);
      } else {
        alert("Error de autenticación con el proveedor.");
        loadStatus();
      }
    } catch (e) {
      console.error(e);
      loadStatus();
    }
  };

  const PlatformCard = ({ id, name, icon: Icon, description }: any) => {
    const isConnected = status[id] === 'connected';
    const isConnecting = status[id] === 'connecting';

    return (
      <div className={`relative p-6 bg-slate-900/50 border ${isConnected ? 'border-emerald-500/30' : 'border-slate-800'} hover:border-blue-500/50 transition-all duration-300 group overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${isConnected ? 'bg-emerald-500' : 'bg-slate-700 group-hover:bg-blue-500'} transition-colors`} />
        
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg group-hover:border-blue-500/30 transition-colors">
            <Icon className={`w-8 h-8 ${isConnected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${
            isConnected 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
              : 'bg-slate-950/50 border-slate-800 text-slate-500'
          }`}>
            {isConnected ? (
              <>
                <CheckCircle className="w-3 h-3" /> LINKED
              </>
            ) : isConnecting ? (
               <>
                <RefreshCw className="w-3 h-3 animate-spin" /> SYNC...
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" /> OFFLINE
              </>
            )}
          </div>
        </div>

        <h3 className="text-xl text-slate-200 font-bold font-mono mb-2">{name}</h3>
        <p className="text-sm text-slate-500 font-mono mb-6 h-10 leading-relaxed">
          {description}
        </p>

        <button
          onClick={() => handleConnect(id)}
          disabled={isConnected || isConnecting}
          className={`w-full py-3 px-4 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest border transition-all duration-200 ${
            isConnected 
              ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-500 cursor-default'
              : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:border-blue-400 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
          }`}
        >
          {isConnected ? (
            'CONEXIÓN SEGURA'
          ) : isConnecting ? (
            'ESTABLECIENDO ENLACE...'
          ) : (
            <>
              <LinkIcon className="w-4 h-4" /> INICIAR PROTOCOLO
            </>
          )}
        </button>
      </div>
    );
  };

  // Eliminamos el <DashboardLayout> que envolvía todo
  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#020202]"> 
      
      {/* Header Táctico */}
      <div className="mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-mono font-bold text-slate-100 mb-2 flex items-center gap-3">
          <span className="w-3 h-8 bg-blue-600 block"></span>
          DATA SOURCES
        </h1>
        <p className="text-slate-500 font-mono pl-6 text-sm">
          // Configuración de uplinks para ingesta de datos en tiempo real.
        </p>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <PlatformCard 
          id="meta" 
          name="META ADS" 
          icon={Globe}
          description="Ingesta de métricas de Facebook e Instagram. Acceso nivel Graph API v19.0."
        />
        <PlatformCard 
          id="google_ads" 
          name="GOOGLE ADS" 
          icon={Search}
          description="Sincronización con Search, Display y YouTube. Requiere Developer Token."
        />
        <PlatformCard 
          id="analytics" 
          name="G. ANALYTICS 4" 
          icon={BarChart2}
          description="Lectura de eventos de conversión y atribución web. Propiedad GA4."
        />
      </div>

      {/* Footer de Seguridad */}
      <div className="mt-auto border border-blue-900/30 bg-blue-950/10 p-4 flex items-start gap-4 max-w-2xl">
        <ShieldCheck className="text-blue-400 w-6 h-6 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-blue-400 font-mono text-sm font-bold uppercase mb-1">Cifrado Militar AES-256</h4>
          <p className="text-blue-300/60 text-xs font-mono leading-relaxed">
            Todas las credenciales son encriptadas antes de tocar la base de datos. 
            El sistema opera bajo principios de "Zero Trust". LeadBoost nunca almacena tus tokens en texto plano.
          </p>
        </div>
      </div>

    </div>
  );
}