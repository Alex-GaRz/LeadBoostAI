
import React from 'react';
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
								let brand = businessName ? String(businessName) : 'Nombre de marca';
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
															<div className="bg-[#f6f7f9] px-4 pt-2 pb-1 border-b border-gray-200">
																{/* Primera fila: Reacciones y métricas */}
																<div className="flex items-center justify-between text-xs text-gray-500 mb-1 w-full">
																						<div className="flex items-center gap-1 min-w-0">
																							{/* Pulgar */}
																							<span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-white -mr-1">
																								<svg viewBox="0 0 20 20" className="w-4 h-4" style={{display:'block'}}><circle cx="10" cy="10" r="10" fill="#1877f2"/><path d="M7.5 10.5v-3A1.5 1.5 0 019 6h2a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5H9A1.5 1.5 0 017.5 10.5z" fill="#fff"/></svg>
																							</span>
																							{/* Corazón */}
																							<span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-white -mr-1">
																								<svg viewBox="0 0 20 20" className="w-4 h-4" style={{display:'block'}}><circle cx="10" cy="10" r="10" fill="#f02849"/><path d="M10 14.5s-4-2.5-4-5.5a2.5 2.5 0 015 0a2.5 2.5 0 015 0c0 3-4 5.5-4 5.5z" fill="#fff"/></svg>
																							</span>
																							{/* Risa */}
																							<span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-white">
																								<svg viewBox="0 0 20 20" className="w-4 h-4" style={{display:'block'}}><circle cx="10" cy="10" r="10" fill="#f7b125"/><ellipse cx="7.5" cy="8.5" rx="1" ry="1.2" fill="#fff"/><ellipse cx="12.5" cy="8.5" rx="1" ry="1.2" fill="#fff"/><path d="M7 12c1.5 1 4.5 1 6 0" stroke="#fff" strokeWidth="1.2" fill="none"/></svg>
																							</span>
																							<span className="ml-1 font-semibold text-xs text-gray-600">{likes}</span>
																						</div>
																	<div className="flex-shrink-0 text-xs text-gray-600">
																		<span>{comentarios}</span>
																		<span className="mx-1">·</span>
																		<span>{compartido}</span>
																	</div>
																</div>
																{/* Separador */}
																<hr className="my-1 border-gray-200" />
																					{/* Segunda fila: barra de acción */}
																					<div className="flex items-center justify-between text-gray-600 text-sm font-semibold">
																						<button className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-transparent border-none hover:bg-gray-100 focus:outline-none">
																							{/* Like icon Facebook */}
																							<svg viewBox="0 0 20 20" className="w-5 h-5" fill="#65676b"><path d="M7.5 10.5v-3A1.5 1.5 0 019 6h2a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5H9A1.5 1.5 0 017.5 10.5z" fill="#65676b"/><circle cx="10" cy="10" r="10" fill="none"/></svg>
																							<span className="font-normal">Me gusta</span>
																						</button>
																						<button className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-transparent border-none hover:bg-gray-100 focus:outline-none">
																							{/* Bubble comment Facebook */}
																							<svg viewBox="0 0 20 20" className="w-5 h-5" fill="#65676b"><path d="M18 10c0 3.866-3.582 7-8 7a8.96 8.96 0 01-3.468-.664l-3.13.782a1 1 0 01-1.212-1.212l.782-3.13A7.96 7.96 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zm-8 5c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5c0 1.13.47 2.18 1.29 3.03a1 1 0 01.23.97l-.47 1.88 1.88-.47a1 1 0 01.97.23A5.96 5.96 0 0010 15z"/></svg>
																							<span className="font-normal">Comentar</span>
																						</button>
																						<button className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-transparent border-none hover:bg-gray-100 focus:outline-none">
																							{/* Share arrow Facebook */}
																							<svg viewBox="0 0 20 20" className="w-5 h-5" fill="#65676b"><path d="M15 8a3 3 0 00-2.995 2.824L12 11v.382l-5.447 2.724A2 2 0 004 16.618V17a3 3 0 002.824 2.995L7 20h6a3 3 0 002.995-2.824L16 17v-.382a2 2 0 00-1.553-1.954L9 11.382V11a3 3 0 003-3z"/></svg>
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
