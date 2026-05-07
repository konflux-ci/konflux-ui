import { render } from '@testing-library/react';
import { mockReleases } from '../__data__/mock-release-data';
import ReleaseListRow from '../ReleaseListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../Releases/release-actions', () => ({
  useReleaseActions: () => [{ id: 're-run-release', label: 'Re-run release', cta: jest.fn() }],
}));

jest.mock('../../../shared/components/action-menu/ActionMenu', () => {
  return (props) => (
    <div data-test="action-menu">
      {props.actions.map((a) => (
        <button key={a.id}>{a.label}</button>
      ))}
    </div>
  );
});

// test-release-3 is Failed, test-release-2 is Succeeded
const failedRelease = { ...mockReleases[2], product: 'Product A', productVersion: '1.0.0' };
const succeededRelease = { ...mockReleases[1], product: 'Product B', productVersion: '2.0.0' };

describe('ReleaseMonitor ReleaseListRow', () => {
  it('should render action menu for a failed release', () => {
    const wrapper = render(<ReleaseListRow obj={failedRelease} columns={[]} />, {
      container: document.createElement('tr'),
    });

    expect(wrapper.getByText('Re-run release')).toBeTruthy();
    expect(wrapper.container.querySelector('[data-test="action-menu"]')).not.toBeNull();
  });

  it('should not render action menu for a succeeded release', () => {
    const wrapper = render(<ReleaseListRow obj={succeededRelease} columns={[]} />, {
      container: document.createElement('tr'),
    });

    expect(wrapper.queryByText('Re-run release')).toBeNull();
    expect(wrapper.container.querySelector('[data-test="action-menu"]')).toBeNull();
  });
});
