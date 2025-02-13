import { screen, act, fireEvent } from '@testing-library/react';
import { formikRenderer } from '../../../../../../utils/test-utils';
import BugFormContent from '../BugFormContent';

describe('BugFormContent', () => {
  beforeEach(() => {});

  it('should show correct heading ', () => {
    formikRenderer(<BugFormContent modalToggle={null} />);
    expect(
      screen.getByText('Provide information about a Bug that has already been resolved.'),
    ).toBeVisible();
  });

  it('should show correct input fields ', () => {
    formikRenderer(<BugFormContent modalToggle={null} />);

    expect(screen.getByRole('textbox', { name: 'Bug issue id' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Source' })).toBeVisible();
  });

  it('should show correct values', () => {
    formikRenderer(<BugFormContent modalToggle={null} />, {
      id: 'RHTAP-120',
      source: 'url1',
    });
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Bug issue id' }).value).toBe(
      'RHTAP-120',
    );
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Source' }).value).toBe('url1');
  });

  it('should have disabled Submit button when url and key not there', () => {
    formikRenderer(<BugFormContent modalToggle={null} />);
    expect(screen.getByTestId('add-bug-btn')).toBeDisabled();
  });

  it('should have disabled Submit button and error text when url is invalid', async () => {
    formikRenderer(<BugFormContent modalToggle={null} />);
    const id = screen.getByTestId('bug-issue-id');
    const source = screen.getByTestId('bug-source');

    await act(() => fireEvent.change(id, { value: 'ISSUE-420' }));
    await act(() => fireEvent.change(source, { value: 'invalid' }));
    expect(screen.getByTestId('add-bug-btn')).toBeDisabled();
  });
});
