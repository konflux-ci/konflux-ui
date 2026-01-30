import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useComponent } from '../../../../hooks/useComponents';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import ComponentDetailsView from '../ComponentDetailsView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

const useComponentMock = useComponent as jest.Mock;
const useParamsMock = useParams as jest.Mock;

const mockComponent = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
  },
  spec: {
    componentName: 'my-component',
    source: {
      url: 'https://example.com/repo',
    },
  },
};

describe('ComponentDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
  });

  it('should render spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should render details when component is loaded', () => {
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(screen.findByText('my-component')).toBeTruthy();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});
