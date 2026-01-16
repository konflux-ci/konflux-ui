import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { ConfigMapModel } from '~/models/config-map';
import { checkAccess } from '~/utils/rbac';

export const checkIfSystemNotificationsAccessible = async () => {
  try {
    const result = await checkAccess(
      '',
      ConfigMapModel.plural,
      undefined,
      KONFLUX_INFO_NAMESPACE,
      'list',
    );
    return result.status?.allowed ?? false;
  } catch {
    return false;
  }
};
