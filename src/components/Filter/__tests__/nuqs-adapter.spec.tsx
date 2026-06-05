import { MemoryRouter } from 'react-router-dom';
import { render, screen, act } from '@testing-library/react';
import { useQueryState } from 'nuqs';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { NuqsAdapter } from '~/components/Filter/nuqs-adapter';

const TestComponent = () => {
  const [value, setValue] = useQueryState('test');
  return (
    <div>
      <span data-test="value">{value ?? 'null'}</span>
      <button data-test="set" onClick={() => setValue('hello')}>
        Set
      </button>
      <button data-test="clear" onClick={() => setValue(null)}>
        Clear
      </button>
    </div>
  );
};

const renderWithRouter = (initialEntries: string[] = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <NuqsAdapter>
        <TestComponent />
      </NuqsAdapter>
    </MemoryRouter>,
  );

describe('nuqs adapter', () => {
  it('reads initial value from URL', () => {
    // NuqsTestingAdapter is used here because the react-router v6 adapter
    // reads from window.location which MemoryRouter does not modify in jsdom.
    render(
      <NuqsTestingAdapter searchParams="?test=world">
        <TestComponent />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('value')).toHaveTextContent('world');
  });

  it('writes value to URL', () => {
    renderWithRouter();
    expect(screen.getByTestId('value')).toHaveTextContent('null');
    act(() => {
      screen.getByTestId('set').click();
    });
    expect(screen.getByTestId('value')).toHaveTextContent('hello');
  });

  it('clears value from URL', () => {
    renderWithRouter(['/?test=world']);
    act(() => {
      screen.getByTestId('clear').click();
    });
    expect(screen.getByTestId('value')).toHaveTextContent('null');
  });
});
