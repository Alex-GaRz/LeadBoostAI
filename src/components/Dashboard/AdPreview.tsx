
import React from 'react';
import { FaThumbsUp, FaComment, FaShare, FaHeart, FaLaugh } from 'react-icons/fa';
import { IaData, CampaignData } from './DashboardCampaignTabs';

interface AdPreviewProps {
	platform: string;
	iaData: IaData | null;
	campaignData: CampaignData | undefined;
	variant?: number;
	businessName?: string;
}

const AdPreview: React.FC<AdPreviewProps> = ({ platform, iaData, campaignData, variant, businessName }) => {
	// Helper para obtener los datos de la variante
	const getVar = (n: 1 | 2 | 3) => iaData?.["Anuncio generado por IA"]?.[`Variante ${n}`] || {};

	// Si se pasa variant, solo mostrar esa variante
	const variantsToShow = variant ? [variant] : [1, 2, 3];

			return (
				<div className="w-full h-full flex flex-col gap-6 justify-stretch items-stretch">
					{/* Vista previa para Meta Ads */}
					{platform === 'Meta Ads' && iaData && (
						<>
							{variantsToShow.map((v) => {
								const variante = getVar(v as 1 | 2 | 3);
								const brand = businessName ? String(businessName) : 'Nombre de marca';
								  const patrocinado = 'Publicidad';
								  const textoPrincipal = variante['Texto principal'] || 'Sin texto principal';
								  const titulo = variante['Título del anuncio'] || 'Sin título';
								  const cta = variante['CTA'] || 'Más información';
								  const imagenUrl = campaignData?.user_image_url || campaignData?.generated_image_url;
								  const descripcion = titulo;
																// Reacciones y conteos fijos para demo
																  const likes = '13,326';
																  const comentarios = '1 mil comentarios';
																  const compartido = '1 vez compartido';

								return (
									<div key={v} className="flex flex-col h-full w-full border border-gray-200 rounded-lg bg-white shadow-md mb-4 max-w-md mx-auto font-sans">
										{/* Header */}
										<div className="flex items-center p-3 pb-1">
											<div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white text-lg">{brand[0]}</div>
											<div className="ml-3">
												<div className="font-bold text-sm text-gray-800">{brand}</div>
												<div className="text-xs text-gray-500">{patrocinado}</div>
											</div>
											<div className="ml-auto text-gray-500 font-bold">...</div>
										</div>
										{/* Texto principal */}
										<div className="px-3 pb-2 text-base text-gray-800 font-medium">
											{textoPrincipal}
										</div>
															{/* Imagen */}
															<div className="w-full bg-gray-200 relative overflow-hidden">
																{imagenUrl ? (
																	<img src={imagenUrl} alt="Ad" className="object-cover w-full" style={{ display: 'block', maxHeight: 400, width: '100%' }} />
																) : (
																	<div className="flex items-center justify-center h-64 text-gray-400">Placeholder</div>
																)}
															</div>
																				{/* Pie de anuncio estilo Facebook */}
																				<div className="bg-[#f6f7f9] px-4 pt-2 pb-1 border-b border-gray-200">
																					<div className="flex items-center justify-between mb-1">
																						<div className="text-base font-bold text-gray-900 leading-tight">{descripcion}</div>
																						<button className="bg-gray-200 text-gray-800 text-sm font-semibold px-3 py-1 rounded-lg ml-2 whitespace-nowrap">{cta}</button>
																					</div>
																				</div>
                              {/* Reacciones y métricas + barra de acción */}
                              <div className="bg-white px-4 pt-2 pb-1">
                                {/* Primera fila: Reacciones y métricas */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2 w-full">
                                  <div className="flex items-center">
                                    <span className="p-1 bg-blue-600 rounded-full z-20">
                                      <FaThumbsUp className="w-2 h-2 text-white" />
                                    </span>
                                    <span className="p-1 bg-red-500 rounded-full -ml-1 z-10">
                                      <FaHeart className="w-2 h-2 text-white" />
                                    </span>
                                    <span className="p-1 bg-yellow-400 rounded-full -ml-1 z-0">
                                      <FaLaugh className="w-2 h-2 text-white" />
                                    </span>
                                    <span className="ml-2 font-normal text-sm text-gray-600">{likes}</span>
                                  </div>
                                  <div className="flex-shrink-0 text-sm text-gray-600">
                                    <span>{comentarios}</span>
                                    <span className="mx-1">·</span>
                                    <span>{compartido}</span>
                                  </div>
                                </div>

                                {/* Separador */}
                                <hr className="my-1 border-gray-300" />

                                {/* Segunda fila: barra de acción */}
                                <div className="flex items-center justify-around text-gray-600 text-sm font-semibold">
                                  <button className="flex-1 flex items-center justify-center gap-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none">
                                    <FaThumbsUp className="w-5 h-5 text-gray-600" />
                                    <span className="font-normal">Me gusta</span>
                                  </button>
                                  <button className="flex-1 flex items-center justify-center gap-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none">
                                    <FaComment className="w-5 h-5 text-gray-600" />
                                    <span className="font-normal">Comentar</span>
                                  </button>
                                  <button className="flex-1 flex items-center justify-center gap-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none">
                                    <FaShare className="w-5 h-5 text-gray-600" />
                                    <span className="font-normal">Compartir</span>
                                  </button>
                                </div>
                              </div>
									</div>
								);
							})}
						</>
					)}

				{/* Vista previa para Google Ads */}
				   {platform === 'Google Ads' && iaData && (
					   <>
						   {variantsToShow.map((v) => {
							   const variante = getVar(v as 1 | 2 | 3);
							   const imagenUrl = campaignData?.user_image_url || campaignData?.generated_image_url;

							   return (
								   <div key={v} className="flex flex-col h-full w-full border border-gray-200 rounded-lg bg-gray-50 shadow-md mb-4 max-w-md mx-auto font-sans p-4">
									   {imagenUrl && (
										   <div className="w-full aspect-[1.91/1] bg-gray-200 mb-3">
											   <img src={imagenUrl} alt="Ad" className="object-cover w-full h-full" />
										   </div>
									   )}
									   <div className="text-xl font-bold text-gray-800 mb-1">{variante["Título sugerido"] || 'Sin título'}</div>
									   <div className="text-sm text-gray-600 mb-3">{variante["Descripción corta"] || 'Sin texto principal'}</div>
									   
									   <div className="mt-auto pt-3 border-t border-gray-200">
										   <button className="bg-blue-500 text-white w-full py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors">
											   {variante["CTA"] || 'Más información'}
										   </button>
									   </div>
								   </div>
							   );
						   })}
					   </>
				   )}
			</div>
		);
};

export default AdPreview;
