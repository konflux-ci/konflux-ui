import { act, fireEvent, render } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import BugRFEForm from '../components/BugRFEForm';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => [{ visibility: 'private' }]),
}));

const onCloseMock = jest.fn();
const onBackMock = jest.fn();
const onSubmitMock = jest.fn();

describe('BugRFEForm', () => {
  it('should show BugForm when current Section is BugSection', () => {
    const screen = routerRenderer(
      <BugRFEForm
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
        sectionHeading="Report a bug"
        sectionDescription="Describe the bug you encountered"
      />,
    );
    screen.getByText('Report a bug');
    screen.getByText(/Describe the bug you encountered/);
    screen.getByText('Title');
    screen.getByText('Please provide detailed description');
  });

  it('should go to Beginning section when Back button is clicked', () => {
    const screen = render(
      <BugRFEForm
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
        sectionDescription=""
        sectionHeading=""
      />,
    );
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    expect(onBackMock).toHaveBeenCalled();
  });

  it('should close Form when Cancel is clicked', () => {
    const screen = render(
      <BugRFEForm
        sectionDescription=""
        sectionHeading=""
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
      />,
    );
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });
});

describe('BugForm input and validation', () => {
  it('should show correct input fields', () => {
    const screen = routerRenderer(
      <BugRFEForm
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
        sectionDescription=""
        sectionHeading=""
        isAdditionalInfo
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Title' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'get system info' })).toBeVisible();
  });

  it('should have disabled Submit button by default', () => {
    const screen = routerRenderer(
      <BugRFEForm
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
        sectionDescription=""
        sectionHeading=""
      />,
    );
    expect(screen.getByRole('button', { name: 'Preview on Github' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Preview on Github' })).toBeDisabled();
  });

  it('should enable submit button after correct entries and call on Submit', () => {
    const screen = routerRenderer(
      <BugRFEForm
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
        sectionDescription=""
        sectionHeading=""
      />,
    );

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    act(() => {
      fireEvent.change(titleInput, { target: { value: 'Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'Description' } });
    });

    expect(screen.getByRole('button', { name: 'Preview on Github' })).toBeEnabled();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Preview on Github' }));
      expect(onSubmitMock).toHaveBeenCalled();
      expect(onSubmitMock).toHaveBeenCalledWith({
        title: 'Title',
        description: 'Description',
        additionalInfo: false,
      });
    });
  });

  it('should request additionalInfo when selected', () => {
    const screen = routerRenderer(
      <BugRFEForm
        onClose={onCloseMock}
        onBack={onBackMock}
        onSubmit={onSubmitMock}
        sectionDescription=""
        sectionHeading=""
        isAdditionalInfo
      />,
    );

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    act(() => {
      fireEvent.change(titleInput, { target: { value: 'Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'Description' } });
      fireEvent.click(screen.getByRole('checkbox', { name: 'get system info' }));
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Preview on Github' }));
      expect(onSubmitMock).toHaveBeenCalled();
      expect(onSubmitMock).toHaveBeenCalledWith({
        title: 'Title',
        description: 'Description',
        additionalInfo: true,
      });
    });
  });
});
