import { screen } from '@testing-library/react';
import { createUseParamsMock } from '~/unit-test-utils/mock-react-router';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { ComponentVersionsTab } from '../ComponentVersionsTab';

jest.mock(
  '~/components/ComponentVersion/ComponentVersionListView/ComponentVersionListView',
  () => ({
    __esModule: true,
    default: ({ componentName }: { componentName: string }) => (
      <div data-test="mock-version-list-view">ComponentVersionListView: {componentName}</div>
    ),
  }),
);

describe('ComponentVersionsTab', () => {
  beforeEach(() => {
    createUseParamsMock({ componentName: 'my-component' });
  });

  it('should render the Versions title', () => {
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Versions')).toBeInTheDocument();
  });

  it('should pass componentName to ComponentVersionListView', () => {
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('ComponentVersionListView: my-component')).toBeInTheDocument();
  });
});
