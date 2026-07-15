import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import {
  ConfirmSubmissionComponentRelationModal,
  DefineComponentRelationModal,
} from '../cr-modals';
import { ComponentRelationNudgeType } from '../type';
import { componentRelationValidationSchema } from '../utils';

configure({ testIdAttribute: 'id' });

class MockResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

window.ResizeObserver = MockResizeObserver;

const duplicateRelations = {
  relations: [
    {
      source: 'component-a',
      nudgeType: ComponentRelationNudgeType.NUDGES,
      target: ['component-b'],
    },
    {
      source: 'component-a',
      nudgeType: ComponentRelationNudgeType.NUDGES,
      target: ['component-c'],
    },
  ],
};

const renderDefineModal = (
  initialValues = duplicateRelations,
  options?: { validateOnMount?: boolean },
) =>
  render(
    <Formik
      initialValues={initialValues}
      validationSchema={componentRelationValidationSchema}
      onSubmit={jest.fn()}
      validateOnMount={options?.validateOnMount}
    >
      <DefineComponentRelationModal
        modalProps={{ isOpen: true }}
        componentNames={['component-a', 'component-b', 'component-c']}
        sortedGroupedComponents={{
          app: ['component-a', 'component-b', 'component-c'],
        }}
        onCancel={jest.fn()}
      />
    </Formik>,
  );

describe('cr-modals', () => {
  it('should show duplicate relationship error message', async () => {
    renderDefineModal(duplicateRelations, { validateOnMount: true });

    await waitFor(() => {
      expect(
        screen.getByText(
          'This relationship is already set up. To edit, go to the respective field in this modal',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should render multiple relations with dividers between them', () => {
    renderDefineModal({
      relations: [
        {
          source: 'component-a',
          nudgeType: ComponentRelationNudgeType.NUDGES,
          target: ['component-b'],
        },
        {
          source: 'component-c',
          nudgeType: ComponentRelationNudgeType.NUDGES,
          target: ['component-b'],
        },
      ],
    });

    expect(screen.getByText('component-a')).toBeInTheDocument();
    expect(screen.getByText('component-c')).toBeInTheDocument();
    expect(screen.getAllByTestId('remove-relation-0')).toHaveLength(1);
    expect(screen.getAllByTestId('remove-relation-1')).toHaveLength(1);
    expect(document.querySelectorAll('.pf-v5-c-divider')).toHaveLength(1);
  });

  it('should render confirmation modal after successful submission', () => {
    const onClose = jest.fn();

    render(
      <ConfirmSubmissionComponentRelationModal modalProps={{ isOpen: true, onClose }} />,
    );

    expect(screen.getByText('Relationships updated!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
