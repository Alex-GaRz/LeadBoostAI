import { useEffect, useState } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button, Flex } from '@tremor/react';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
// Dummy types and fetch function to avoid import errors
type Campaign = {
  id: string;
  name: string;
  platform: string;
  status: string;
  spent_total: number;
  roas: number;
};
const fetchCampaigns = async (): Promise<Campaign[]> => [];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  useEffect(() => {
    fetchCampaigns().then(setCampaigns);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <Flex justifyContent="between">
        <div>
          <Title className="text-white text-2xl">Sala de Guerra (War Room)</Title>
          <Text className="text-slate-400">Supervisión táctica de campañas activas.</Text>
        </div>
        <Button size="xs" variant="secondary" icon={ArrowPathIcon}>Refrescar Métricas</Button>
      </Flex>

      <Card className="bg-slate-900 ring-slate-800">
        <Table className="mt-2">
          <TableHead>
            <TableRow>
              <TableHeaderCell className="text-slate-300">Campaña</TableHeaderCell>
              <TableHeaderCell className="text-slate-300">Plataforma</TableHeaderCell>
              <TableHeaderCell className="text-slate-300">Estado</TableHeaderCell>
              <TableHeaderCell className="text-slate-300 text-right">Inversión</TableHeaderCell>
              <TableHeaderCell className="text-slate-300 text-right">ROAS</TableHeaderCell>
              <TableHeaderCell className="text-slate-300 text-right">Control</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-10">
                  No hay campañas activas en este momento. Aprueba estrategias en la Sala de Decisión.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell className="text-white font-medium">{camp.name}</TableCell>
                  <TableCell>
                    <Badge size="xs" color="blue">{camp.platform}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge size="xs" color={camp.status === 'ACTIVE' ? 'emerald' : 'gray'}>
                      {camp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">${camp.spent_total}</TableCell>
                  <TableCell className="text-right text-emerald-400 font-bold">{camp.roas}x</TableCell>
                  <TableCell className="text-right">
                    <Button size="xs" variant="secondary" icon={camp.status === 'ACTIVE' ? PauseIcon : PlayIcon}>
                      {camp.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}