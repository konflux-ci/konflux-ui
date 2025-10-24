import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { LEARN_MORE_ABOUT_SECRETS_CREATION } from '~/consts/documentation';
import { FULL_APPLICATION_TITLE } from '~/consts/labels';
import { routerRenderer } from '~/utils/test-utils';
import SecretsListPage from '../SecretsListPage';

// SecretsListView has its own tests. We mock it here to focus on
// testing SecretsListPage's logic: page layout and document title.
jest.mock('../SecretsListView/SecretsListView', () => ({
  __esModule: true,
  default: jest.fn(() => <div>SecretsListView</div>),
}));

describe('SecretsListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page with correct title and description', () => {
    routerRenderer(<SecretsListPage />);

    expect(screen.getByText('Secrets')).toBeInTheDocument();
    expect(
      screen.getByText(/Manage your secrets and their related configurations/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/All secrets are stored using AWS Secrets Manager/i),
    ).toBeInTheDocument();
  });

  it('should set the document title correctly', () => {
    routerRenderer(<SecretsListPage />);

    expect(document.title).toBe(`Secrets | ${FULL_APPLICATION_TITLE}`);
  });

  it('should render the external link with correct href', () => {
    routerRenderer(<SecretsListPage />);

    const link = screen.getByText('Learn more');
    expect(link).toHaveAttribute('href', LEARN_MORE_ABOUT_SECRETS_CREATION);
  });

  it('should render the SecretsListView component', () => {
    routerRenderer(<SecretsListPage />);

    expect(screen.getByText('SecretsListView')).toBeInTheDocument();
  });
});
