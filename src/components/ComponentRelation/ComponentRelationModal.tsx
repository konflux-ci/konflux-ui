import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useAllComponents, useComponents } from '../../hooks/useComponents';
import { ComponentKind } from '../../types';
import { TrackEvents, useTrackEvent } from '../../utils/analytics';
import { RawComponentProps, createRawModalLauncher } from '../modal/createModalLauncher';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';
import {
  ConfirmCancelationComponentRelationModal,
  ConfirmSubmissionComponentRelationModal,
  DefineComponentRelationModal,
} from './cr-modals';
import { ComponentRelationFormikValue, ComponentRelationNudgeType } from './type';
import { useNudgeData } from './useNudgeData';
import { componentRelationValidationSchema, updateNudgeDependencies } from './utils';

type ComponentRelationProps = { application: string };

type ComponentRelationModalProps = RawComponentProps & ComponentRelationProps;

export const ComponentRelationModal: React.FC<ComponentRelationModalProps> = ({
  modalProps,
  application,
}) => {
  const track = useTrackEvent();
  const [showCancelModal, setShowCancelModal] = React.useState<boolean>(false);
  const [showSubmissionModal, setShowSubmissionModal] = React.useState<boolean>(false);
  const [nudgeData, loaded, error] = useNudgeData(application);
  const { namespace, workspace } = useWorkspaceInfo();
  const [components, cnLoaded, cnError] = useComponents(namespace, workspace, application);
  const [allComponents, allCompsLoaded, allCompsError] = useAllComponents(namespace, workspace);
  const groupedComponents = React.useMemo(
    () =>
      allCompsLoaded && !allCompsError
        ? allComponents.reduce((acc, val) => {
            if (acc[val.spec.application]) {
              acc[val.spec.application] = [...acc[val.spec.application], val.metadata.name];
            } else {
              acc[val.spec.application] = [val.metadata.name];
            }
            return acc;
          }, {})
        : {},
    [allComponents, allCompsError, allCompsLoaded],
  );
  const componentNames: string[] = React.useMemo(() => {
    return cnLoaded && !cnError ? components.map((c) => c.metadata.name) : [];
  }, [cnError, cnLoaded, components]);

  const onSaveRelationships = React.useCallback(() => {
    setShowSubmissionModal(true);
  }, []);

  const onCancelSaveRelationships = React.useCallback(() => {
    track(TrackEvents.ButtonClicked, {
      link_name: 'component-relationship-modal-leave',
      app_name: application,
      workspace,
    });
    setShowCancelModal(true);
  }, [application, track, workspace]);

  const initialValues: ComponentRelationFormikValue = React.useMemo(() => {
    return {
      relations:
        loaded && !error && nudgeData.length > 0
          ? nudgeData
          : [{ source: '', nudgeType: ComponentRelationNudgeType.NUDGES, target: [] }],
    };
  }, [error, loaded, nudgeData]);

  const handleSubmit = React.useCallback(
    async (
      values: ComponentRelationFormikValue,
      helpers: FormikHelpers<ComponentRelationFormikValue>,
    ) => {
      track(TrackEvents.ButtonClicked, {
        link_name: 'component-relationship-modal-submit',
        app_name: application,
        workspace,
      });
      try {
        await updateNudgeDependencies(values.relations, initialValues.relations, namespace, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error while updating dependency data for component`, e);

        helpers.setSubmitting(false);
        helpers.setStatus({ submitError: e?.message });
      }
      return updateNudgeDependencies(values.relations, initialValues.relations, namespace)
        .then((compResults: ComponentKind[]) => {
          compResults.forEach((c) => {
            track('Component relationship updated', {
              component_name: c.metadata.name,
              app_name: application,
              workspace,
            });
          });
          onSaveRelationships();
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(`Error while updating dependency data for component`, e);

          helpers.setSubmitting(false);
          helpers.setStatus({ submitError: e?.message });
        });
    },
    [application, namespace, onSaveRelationships, track, workspace, initialValues],
  );

  if (showSubmissionModal && !showCancelModal) {
    return <ConfirmSubmissionComponentRelationModal modalProps={modalProps} />;
  }
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={componentRelationValidationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {showCancelModal && !showSubmissionModal ? (
        <ConfirmCancelationComponentRelationModal
          modalProps={modalProps}
          onGoBack={() => setShowCancelModal(false)}
        />
      ) : (
        <DefineComponentRelationModal
          componentNames={cnLoaded && !cnError ? componentNames : []}
          groupedComponents={groupedComponents}
          modalProps={modalProps}
          onCancel={onCancelSaveRelationships}
        />
      )}
    </Formik>
  );
};

export const createComponentRelationModal = (props: ComponentRelationProps) =>
  createRawModalLauncher<ComponentRelationProps, Record<string, unknown>>(ComponentRelationModal, {
    'data-test': 'component-relation-modal',
  })(props);
