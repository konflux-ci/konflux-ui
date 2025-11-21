import { screen } from '@testing-library/react';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../utils/test-utils';
import { useWhatsNextItems } from '../../WhatsNext/useWhatsNextItems';
import ApplicationOverviewTab from '../ApplicationOverviewTab';

jest.mock('../../WhatsNext/useWhatsNextItems', () => ({
  useWhatsNextItems: jest.fn(),
}));

const useParamsMock = createUseParamsMock();
const useWhatsNextItemsMock = useWhatsNextItems as jest.Mock;

const mockWhatsNextItems = [
  {
    id: 0,
    title: 'Test Item',
    description: 'Test description',
    icon: () => <svg />,
    cta: {
      label: 'Test Action',
      href: '/test',
    },
  },
];

describe('ApplicationOverviewTab', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ applicationName: 'test-app' });
    useWhatsNextItemsMock.mockReturnValue(mockWhatsNextItems);
  });

  it('should render WhatsNextSection', () => {
    renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(screen.getByText("What's next?")).toBeInTheDocument();
  });

  it('should call useWhatsNextItems with applicationName', () => {
    renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(useWhatsNextItemsMock).toHaveBeenCalledWith('test-app');
  });

  it('should pass whatsNextItems to WhatsNextSection', () => {
    renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('should handle empty applicationName', () => {
    useParamsMock.mockReturnValue({ applicationName: undefined });
    renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(useWhatsNextItemsMock).toHaveBeenCalledWith(undefined);
  });

  it('should not render cards with empty whatsNextItems', () => {
    useWhatsNextItemsMock.mockReturnValue([]);
    renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });

  it('should render the component structure', () => {
    const { container } = renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(container).toBeInTheDocument();
  });

  it('should handle re-render on param changes', () => {
    const { rerender } = renderWithQueryClientAndRouter(<ApplicationOverviewTab />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();

    useParamsMock.mockReturnValue({ applicationName: 'new-app' });
    rerender(<ApplicationOverviewTab />);
    expect(useWhatsNextItemsMock).toHaveBeenCalledWith('new-app');
  });
});
