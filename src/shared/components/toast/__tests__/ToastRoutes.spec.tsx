import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalProvider, useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { ToastProvider, useToast } from '~/shared/components/toast';

const ModalToastActions = () => {
  const { addToast } = useToast();
  return <button onClick={() => addToast({ title: 'Toast from modal' })}>Add modal toast</button>;
};

const ToastRouteActions = () => {
  const { addToast } = useToast();
  const openModal = useModalLauncher();

  return (
    <>
      <button
        onClick={() =>
          addToast({
            title: 'Route toast',
            description: <Link to="/details">Open details</Link>,
          })
        }
      >
        Add route toast
      </button>
      <button onClick={() => openModal(() => <ModalToastActions />)}>Open modal</button>
    </>
  );
};

describe('ToastProvider application lifetime', () => {
  it('keeps route notifications across navigation and shares the API with modal content', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <ModalProvider>
            <Routes>
              <Route path="/" element={<ToastRouteActions />} />
              <Route path="/details" element={<h1>Details page</h1>} />
            </Routes>
          </ModalProvider>
        </ToastProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Add route toast' }));
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    await user.click(screen.getByRole('button', { name: 'Add modal toast' }));

    expect(screen.getByText('Route toast')).toBeInTheDocument();
    expect(screen.getByText('Toast from modal')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Open details' }));

    expect(screen.getByRole('heading', { name: 'Details page' })).toBeInTheDocument();
    expect(screen.getByText('Route toast')).toBeInTheDocument();
    expect(screen.getByText('Toast from modal')).toBeInTheDocument();
  });
});
