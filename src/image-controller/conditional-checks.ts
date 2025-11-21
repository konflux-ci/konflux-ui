import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { getKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';

export const checkIfImageControllerIsEnabled = async () => {
  try {
    const info = await getKonfluxPublicInfo();
    return info.integrations?.image_controller?.enabled ?? false;
  } catch (error) {
    return false;
  }
};

export const useIsImageControllerEnabled = createConditionsHook(['isImageControllerEnabled']);

export const isImageControllerEnabled = ensureConditionIsOn(['isImageControllerEnabled']);
