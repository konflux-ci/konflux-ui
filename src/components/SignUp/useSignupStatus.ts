import * as React from 'react';
import {
  fetchSignupStatus,
  SignupStatus,
  useSignUpAtom,
  useSignUpPendingAtom,
} from './signup-utils';

const POLL_INTERVAL = 5000;

export const useIsUserSignedUp = () => {
  const [, setSignupFlag] = useSignUpAtom();
  const [, setSignupPendingFlag] = useSignUpPendingAtom();
  React.useEffect(() => {
    let unmounted = false;
    const fetch = async () => {
      const response = await fetchSignupStatus();
      switch (response) {
        case SignupStatus.SignedUp:
          if (unmounted) break;
          setSignupFlag(true);
          break;
        case SignupStatus.PendingApproval:
        case SignupStatus.ProvisioningSpace:
          if (unmounted) break;
          setSignupFlag(false);
          setSignupPendingFlag(true);
          break;
        case SignupStatus.NotSignedUp:
          setSignupFlag(false);
          break;
        default:
          // let's disable the signup if something breaks
          setSignupFlag(false);
          // eslint-disable-next-line no-console
          console.error('Unable to determine signup status.');
      }
    };

    void fetch();

    return () => {
      unmounted = true;
    };
  }, [setSignupFlag, setSignupPendingFlag]);
};

export const useSignupStatus = () => {
  const [signupFlag, setSignupFlag] = useSignUpAtom();
  const [signupPendingFlag, setSignupPendingFlag] = useSignUpPendingAtom();

  React.useEffect(() => {
    if (signupPendingFlag) {
      const handle = setInterval(async () => {
        const response = await fetchSignupStatus();
        if (response === SignupStatus.SignedUp) {
          setSignupFlag(true);
          setSignupPendingFlag(false);
        }
      }, POLL_INTERVAL);

      return () => clearInterval(handle);
    }
  }, [setSignupFlag, setSignupPendingFlag, signupFlag, signupPendingFlag]);

  const status = signupFlag
    ? SignupStatus.SignedUp
    : signupPendingFlag
      ? SignupStatus.PendingApproval
      : SignupStatus.NotSignedUp;

  return status;
};
