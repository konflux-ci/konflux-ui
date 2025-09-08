import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { Formik, FormikHelpers } from 'formik';
import { USER_ACCESS_LIST_PAGE } from '@routes/paths';
import { getErrorState } from '~/shared/utils/error-utils';
import { useRoleMap } from '../../../hooks/useRole';
import { useNamespace } from '../../../shared/providers/Namespace';
import { NamespaceRole, RoleBinding } from '../../../types';
import { TrackEvents, useTrackEvent } from '../../../utils/analytics';
import { createRBs, editRB, userAccessFormSchema, UserAccessFormValues } from './form-utils';
import { UserAccessForm } from './UserAccessForm';

type Props = {
  existingRb?: RoleBinding;
  username?: string;
  edit?: boolean;
};

export const UserAccessFormPage: React.FC<React.PropsWithChildren<Props>> = ({
  existingRb,
  edit,
  username,
}) => {
  const namespace = useNamespace();
  const [roleMap, loaded, error] = useRoleMap();
  const track = useTrackEvent();
  const navigate = useNavigate();

  const handleSubmit = async (
    values: UserAccessFormValues,
    actions: FormikHelpers<UserAccessFormValues>,
  ) => {
    track(TrackEvents.ButtonClicked, {
      ...(edit
        ? {
            link_name: 'edit-access-submit',
            username,
          }
        : {
            link_name: 'grant-access-submit',
          }),
      namespace,
    });
    try {
      await (existingRb ? editRB(values, existingRb, true) : createRBs(values, namespace, true));
      await (existingRb ? editRB(values, existingRb) : createRBs(values, namespace));
      track(edit ? 'Access Edited' : 'Access Created', {
        usernames: values.usernames,
        namespace,
      });
      navigate(USER_ACCESS_LIST_PAGE.createPath({ workspaceName: namespace }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Error while submitting access form:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Failed to submit. Please try again.';
      actions.setStatus({ submitError: message });
    } finally {
      actions.setSubmitting(false);
    }
  };

  const handleReset = () => {
    track(TrackEvents.ButtonClicked, {
      ...(edit
        ? {
            link_name: 'edit-access-leave',
            username,
          }
        : {
            link_name: 'grant-access-leave',
          }),
      namespace,
    });
    navigate(USER_ACCESS_LIST_PAGE.createPath({ workspaceName: namespace }));
  };

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }
  if (error) {
    return getErrorState(error, loaded, 'role binding');
  }

  const initialValues: UserAccessFormValues = {
    usernames: existingRb && existingRb.subjects ? existingRb.subjects.map((sub) => sub.name) : [],
    role: roleMap?.roleMap[existingRb?.roleRef.name] as NamespaceRole,
    roleMap,
  };

  return (
    <Formik
      onSubmit={handleSubmit}
      onReset={handleReset}
      initialValues={initialValues}
      validationSchema={userAccessFormSchema}
    >
      {(props) => (
        <UserAccessForm
          {...props}
          edit={edit}
          missingSubjects={initialValues.usernames.length === 0}
        />
      )}
    </Formik>
  );
};
