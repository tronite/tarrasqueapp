import { Add } from '@mui/icons-material';
import { Button } from '@mui/material';

import { Color } from '../../lib/colors';
import { CampaignEntity } from '../../lib/types';
import { store } from '../../store';
import { MapModal } from '../../store/maps';

interface NewMapProps {
  campaign: CampaignEntity | null;
}

export const NewMap: React.FC<NewMapProps> = ({ campaign }) => {
  return (
    <Button
      disabled={!campaign}
      onClick={() => {
        if (!campaign) return;
        store.campaigns.setSelectedCampaignId(campaign.id);
        store.maps.setModal(MapModal.CreateUpdate);
      }}
      sx={{
        border: `3px dashed ${Color.BrownDark}`,
        width: 250,
        height: 200,
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Add />
      New Map
    </Button>
  );
};
