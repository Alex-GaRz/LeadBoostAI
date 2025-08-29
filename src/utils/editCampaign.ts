/**
 * Navega a la pantalla de edición de una campaña.
 * @param campaignId ID de la campaña
 * @param navigate función de navegación (por ejemplo, useNavigate de react-router)
 */
export function editCampaign(campaignId: string, navigate: (url: string) => void) {
  if (!campaignId) return;
  navigate(`/dashboard/campaign/edit/${campaignId}`);
}
