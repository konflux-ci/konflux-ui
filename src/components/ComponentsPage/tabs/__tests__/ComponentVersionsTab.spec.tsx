import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { ComponentVersionsTab } from '../ComponentVersionsTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock(
  '~/components/ComponentVersion/ComponentVersionListView/ComponentVersionListView',
  () => ({
    __esModule: true,
    default: ({ componentName }: { componentName: string }) => (
      <div data-test="mock-version-list-view">ComponentVersionListView: {componentName}</div>
    ),
  }),
);

const useParamsMock = useParams as jest.Mock;

describe('ComponentVersionsTab', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
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
