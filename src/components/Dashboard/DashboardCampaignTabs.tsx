import React, { useState } from 'react';
import { Layers, Image, Users, BarChart3, Zap, FileText, Repeat2, UploadCloud, CalendarDays, DollarSign, Target, TrendingUp, FileBarChart, Edit3, Copy, Send } from 'lucide-react';

interface DashboardCampaignTabsProps {
  platforms: string[]; // Ejemplo: ['Meta Ads'], ['Google Ads'], ['Meta Ads', 'Google Ads']
}

const DashboardCampaignTabs: React.FC<DashboardCampaignTabsProps> = ({ platforms }) => {
  const [activeTab, setActiveTab] = useState(platforms[0] || '');

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-black mb-1">Nombre de la campaña</h2>
      <p className="text-gray-600 mb-4">Resumen y gestión de tu campaña publicitaria</p>
      <div className="flex border-b border-gray-200 mb-6">
        {platforms.map((platform) => (
          <button
            key={platform}
            className={`px-6 py-2 font-bold border-b-2 transition-colors duration-200 ${
              activeTab === platform
                ? 'border-blue-600 text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
            onClick={() => setActiveTab(platform)}
            style={{ color: activeTab === platform ? '#000' : '#555' }}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Tarjetas separadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalles Generales */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><FileBarChart className="w-5 h-5" style={{color:'#2d4792'}} /> Detalles Generales</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600">
            <div>
              <span className="font-bold flex items-center gap-1"><Layers className="w-4 h-4" style={{color:'#2d4792'}} /> Plataforma</span>
              <div className="text-gray-700 mt-1">{activeTab}</div>
            </div>
            <div>
              <span className="font-bold flex items-center gap-1"><CalendarDays className="w-4 h-4" style={{color:'#2d4792'}} /> Estado</span>
              <div className="text-gray-700 mt-1">Pendiente</div>
            </div>
            <div>
              <span className="font-bold flex items-center gap-1"><Target className="w-4 h-4" style={{color:'#2d4792'}} /> Objetivo</span>
              <div className="text-gray-700 mt-1">Conseguir más clientes</div>
            </div>
            <div>
              <span className="font-bold flex items-center gap-1"><DollarSign className="w-4 h-4" style={{color:'#2d4792'}} /> Presupuesto</span>
              <div className="text-gray-700 mt-1">$5,000 MXN</div>
            </div>
            <div>
              <span className="font-bold flex items-center gap-1"><CalendarDays className="w-4 h-4" style={{color:'#2d4792'}} /> Duración</span>
              <div className="text-gray-700 mt-1">1 mes</div>
            </div>
          </div>
        </div>

        {/* Creatividad */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Anuncio generado por IA</h3>
          {activeTab === 'Meta Ads' ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título del anuncio</span>
                <div className="text-gray-700 mt-1">¡Descubre la mejor oferta para tu negocio!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Texto principal</span>
                <div className="text-gray-700 mt-1">Aprovecha nuestros productos exclusivos y lleva tu empresa al siguiente nivel. ¡No te lo pierdas!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">Comprar ahora</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">Imagen de empresarios felices usando el producto, video corto mostrando el proceso de compra.</div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título(s) sugeridos</span>
                <div className="text-gray-700 mt-1">Oferta exclusiva para tu empresa | Soluciones que impulsan tu negocio</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Descripción corta(s)</span>
                <div className="text-gray-700 mt-1">Descubre cómo nuestros productos pueden ayudarte a crecer. ¡Solicita información hoy!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Keywords recomendadas</span>
                <div className="text-gray-700 mt-1">negocios, soluciones, oferta, comprar, empresa</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">Solicitar información</div>
              </div>
            </>
          )}
        </div>

        {/* Variante 2 */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Variante 2</h3>
          {activeTab === 'Meta Ads' ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título del anuncio</span>
                <div className="text-gray-700 mt-1">¡Impulsa tu empresa con nuestra oferta exclusiva!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Texto principal</span>
                <div className="text-gray-700 mt-1">No dejes pasar la oportunidad de transformar tu negocio. Descubre soluciones innovadoras hoy mismo.</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">Solicita información</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">Video de clientes satisfechos, imagen de equipo colaborando en oficina moderna.</div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título(s) sugeridos</span>
                <div className="text-gray-700 mt-1">¡Haz crecer tu empresa hoy! | Soluciones a tu medida</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Descripción corta(s)</span>
                <div className="text-gray-700 mt-1">Aumenta tus ventas con estrategias digitales personalizadas. ¡Contáctanos!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Keywords recomendadas</span>
                <div className="text-gray-700 mt-1">ventas, digital, crecimiento, empresa, contacto</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">Contáctanos</div>
              </div>
            </>
          )}
        </div>

        {/* Variante 3 */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Variante 3</h3>
          {activeTab === 'Meta Ads' ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título del anuncio</span>
                <div className="text-gray-700 mt-1">¡Impulsa tu empresa con nuestra oferta exclusiva!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Texto principal</span>
                <div className="text-gray-700 mt-1">No dejes pasar la oportunidad de transformar tu negocio. Descubre soluciones innovadoras hoy mismo.</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">Solicita información</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">Video de clientes satisfechos, imagen de equipo colaborando en oficina moderna.</div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título(s) sugeridos</span>
                <div className="text-gray-700 mt-1">¡Haz crecer tu empresa hoy! | Soluciones a tu medida</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Descripción corta(s)</span>
                <div className="text-gray-700 mt-1">Aumenta tus ventas con estrategias digitales personalizadas. ¡Contáctanos!</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Keywords recomendadas</span>
                <div className="text-gray-700 mt-1">ventas, digital, crecimiento, empresa, contacto</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">Contáctanos</div>
              </div>
            </>
          )}
        </div>

        {/* Segmentación sugerida */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Users className="w-5 h-5" style={{color:'#2d4792'}} /> Segmentación sugerida</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
            <div>
              <span className="font-bold">Público objetivo</span>
              <div className="text-gray-700 mt-1">25-45 años, ambos géneros, intereses en marketing digital y tecnología</div>
            </div>
            <div>
              <span className="font-bold">Ubicación geográfica</span>
              <div className="text-gray-700 mt-1">México, Colombia, España</div>
            </div>
            <div>
              <span className="font-bold">Estilo de comunicación</span>
              <div className="text-gray-700 mt-1">Profesional y dinámico</div>
            </div>
          </div>
        </div>

        {/* Acciones disponibles */}
  <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2 w-full">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Zap className="w-5 h-5" style={{color:'#2d4792'}} /> Acciones disponibles</h3>
          <div className="flex gap-4 mb-2 w-full">
            <button className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3">
              <Edit3 className="w-6 h-6" style={{color:'#fff'}} /> Editar anuncio
            </button>
            <button className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3">
              <UploadCloud className="w-6 h-6" style={{color:'#fff'}} /> Exportar a PDF
            </button>
            <button className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3">
              <Copy className="w-6 h-6" style={{color:'#fff'}} /> Duplicar campaña
            </button>
            <button className="flex-1 px-5 py-3 bg-blue-300 text-white font-semibold rounded-lg shadow cursor-not-allowed flex items-center justify-center gap-3" disabled>
              <Send className="w-6 h-6" style={{color:'#fff'}} /> Publicar campaña
            </button>
          </div>
          <p className="text-xs text-gray-400">* Publicar campaña estará disponible cuando se integren las APIs de Meta Ads o Google Ads.</p>
        </div>

        {/* Resultados simulados - horizontal con iconos */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{color:'#2d4792'}} /> Resultados esperados</h3>
          <div className="flex flex-wrap gap-8 items-center justify-center mb-2 mt-4">
            <div className="flex flex-col items-center">
              <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">Alcance</span>
              <div className="text-gray-500 mt-1">50,000</div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">Audiencia</span>
              <div className="text-gray-500 mt-1">18,000</div>
            </div>
            <div className="flex flex-col items-center">
              <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">CPC</span>
              <div className="text-gray-500 mt-1">$0.25 USD</div>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">CTR</span>
              <div className="text-gray-500 mt-1">2.5%</div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">* Estos resultados son simulados y pueden variar en campañas reales.</p>
        </div>
      </div>
    </div>
  );
}

// ...existing code...
export default DashboardCampaignTabs;
