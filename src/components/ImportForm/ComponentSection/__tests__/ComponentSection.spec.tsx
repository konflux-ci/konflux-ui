import { screen, waitFor, configure } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { formikRenderer } from '../../../../utils/test-utils';
import { ComponentSection } from '../ComponentSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

describe('ComponentSection', () => {
  it('should render component section', () => {
    formikRenderer(<ComponentSection />, {
      source: { git: { url: '' } },
    });
    screen.getByPlaceholderText('Enter a GitHub or GitLab repository URL');
    expect(screen.queryByTestId('git-reference')).not.toBeInTheDocument();
  });

  it('should render git options by default', async () => {
    formikRenderer(<ComponentSection />, {
      source: { git: { url: '' } },
    });
    const user = userEvent.setup();
    const source = screen.getByPlaceholderText('Enter a GitHub or GitLab repository URL');

    await user.type(source, 'https://github.com/abcd/repo.git');
    await user.tab();
    await waitFor(() => screen.getByText('Hide advanced Git options'));
  });

  it('should show advanced Annotation section', async () => {
    formikRenderer(<ComponentSection />, {
      source: { git: { url: '' } },
    });
    const user = userEvent.setup();
    const source = screen.getByPlaceholderText('Enter a GitHub or GitLab repository URL');

    await user.type(source, 'https://bitbucket.com/abcd/repo.git');
    await user.tab();
    await waitFor(() => screen.getByTestId('url-annotation'));
  });

  it('should populate annotation fields', async () => {
    formikRenderer(<ComponentSection />, {
      source: { git: { url: '' } },
    });
    const user = userEvent.setup();
    const source = screen.getByPlaceholderText('Enter a GitHub or GitLab repository URL');

    await user.type(source, 'https://gitlab.com/abcd/repo.git');
    await user.tab();
    await waitFor(() =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      expect((screen.getByTestId('url-annotation') as HTMLInputElement).value).toBe(
        'https://gitlab.com',
      ),
    );
  });

  it('should render helper text for component name', () => {
    formikRenderer(<ComponentSection />, {
      source: { git: { url: '' } },
    });

    expect(screen.getByText('Must be unique within tenant namespace')).toBeInTheDocument();
  });

  it('should format component name to kebab-case', async () => {
    formikRenderer(<ComponentSection />, {
      source: { git: { url: '' } },
    });
    const user = userEvent.setup();
    const source = screen.getByPlaceholderText('Enter a GitHub or GitLab repository URL');

    await user.type(source, 'https://github.com/ExampleRepo123.git');
    await user.tab();
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      expect((screen.getByTestId('component-name') as HTMLInputElement).value).toContain(
        'example-repo',
      );
    });
  });
});
