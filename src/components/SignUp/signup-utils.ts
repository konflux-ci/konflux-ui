import { atom, useAtom } from 'jotai';
import { commonFetch } from '../../k8s';

export enum SignupStatus {
  SignedUp = 'SignedUp',
  NotSignedUp = 'NotSignedUp',
  PendingApproval = 'PendingApproval',
  ProvisioningSpace = 'ProvisioningSpace',
  Unknown = 'Unknown',
}

const SignUpAtom = atom(false);
const SignUpPendingAtom = atom(false);

export const useSignUpAtom = () => useAtom(SignUpAtom);
export const useSignUpPendingAtom = () => useAtom(SignUpPendingAtom);

export const fetchSignupStatus = async () => {
  try {
    const response = await commonFetch('/registration/api/v1/signup');
    if (response.status === 200) {
      try {
        const data = await response.json();
        if (data.status.ready) {
          return SignupStatus.SignedUp;
        } else if (data.status.reason === SignupStatus.PendingApproval) {
          return SignupStatus.PendingApproval;
        } else if (data.status.reason === SignupStatus.ProvisioningSpace) {
          return SignupStatus.ProvisioningSpace;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error when fetching signup status: ', e);
        return SignupStatus.Unknown;
      }
    }
  } catch (error) {
    if (error.code === 404) return SignupStatus.NotSignedUp;
  }

  return SignupStatus.Unknown;
};
