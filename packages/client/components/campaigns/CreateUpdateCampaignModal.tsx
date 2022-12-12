import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Theme, useMediaQuery } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateCampaign } from '../../hooks/data/campaigns/useCreateCampaign';
import { useUpdateCampaign } from '../../hooks/data/campaigns/useUpdateCampaign';
import { CampaignFactory } from '../../lib/factories/CampaignFactory';
import { CampaignInterface } from '../../lib/types';
import { store } from '../../store';
import { ValidateUtils } from '../../utils/ValidateUtils';
import { ControlledTextField } from '../form/ControlledTextField';

interface ICreateUpdateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  campaign: CampaignInterface | null;
}

export const CreateUpdateCampaignModal: React.FC<ICreateUpdateCampaignModalProps> = observer(
  ({ open, onClose, campaign }) => {
    const createCampaign = useCreateCampaign();
    const updateCampaign = useUpdateCampaign();

    const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    // Setup form validation schema
    const schema = z.object({
      name: ValidateUtils.Name,
    });
    type Schema = z.infer<typeof schema>;

    // Setup form
    const methods = useForm<Schema>({
      mode: 'onChange',
      resolver: zodResolver(schema),
      defaultValues: campaign || new CampaignFactory(),
    });
    const {
      handleSubmit,
      reset,
      formState: { isSubmitting, isValid },
    } = methods;

    // Reset the form when the campaign changes
    useEffect(() => {
      reset(campaign || new CampaignFactory());
    }, [campaign, reset, store.campaigns.modal]);

    /**
     * Handle the form submission
     * @param values - The campaign values
     */
    async function handleSubmitForm(values: Schema) {
      if (campaign) {
        await updateCampaign.mutateAsync({ ...values, id: campaign.id });
        onClose();
        return;
      }

      await createCampaign.mutateAsync(values);
      onClose();
    }

    return (
      <Dialog fullScreen={fullScreen} fullWidth maxWidth="xs" onClose={onClose} open={open}>
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(handleSubmitForm)}
            style={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}
          >
            <DialogTitle>{campaign ? 'Update Campaign' : 'Create Campaign'}</DialogTitle>

            <DialogContent>
              <ControlledTextField size="small" name="name" label="Name" autoFocus fullWidth />
            </DialogContent>

            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>

              <LoadingButton loading={isSubmitting} disabled={!isValid} variant="contained" type="submit">
                Submit
              </LoadingButton>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    );
  },
);
