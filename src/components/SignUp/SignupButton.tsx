import * as React from 'react';
import { Form, Button, ButtonVariant, ButtonType } from '@patternfly/react-core';
import { Formik } from 'formik';
import { commonFetch } from '../../k8s';
import { useSignUpPendingAtom } from './signup-utils';

const SignupButton: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [, setSignupPending] = useSignUpPendingAtom();

  const onSubmit = (_, actions) => {
    return commonFetch('/registration/api/v1/signup', { method: 'POST' })
      .then((res: Response) => {
        if (res.status === 202) {
          setSignupPending(true);
        }
      })
      .catch((e) => {
        actions.setSubmitting(false);
        // eslint-disable-next-line no-console
        console.error('error -----', e);
      });
  };

  return (
    <Formik initialValues={{}} onSubmit={onSubmit}>
      {({ handleSubmit, isSubmitting }) => (
        <Form onSubmit={handleSubmit}>
          <Button
            aria-label="Join the waitlist"
            variant={ButtonVariant.primary}
            type={ButtonType.submit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
            style={{ width: 'fit-content' }}
            size="lg"
          >
            Join the waitlist
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default SignupButton;
