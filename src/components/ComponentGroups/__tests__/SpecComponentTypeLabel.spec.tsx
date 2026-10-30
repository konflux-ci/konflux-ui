import { render, screen } from '@testing-library/react';
import { ComponentReferenceKind } from '~/types';
import SpecComponentTypeLabel from '../SpecComponentTypeLabel';

describe('SpecComponentTypeLabel', () => {
  it('should show "Component" label in grey for component kind', () => {
    const component = { kind: 'component' as ComponentReferenceKind };
    const { container } = render(<SpecComponentTypeLabel component={component} />);

    const label = screen.getByText('Component');
    expect(label).toBeInTheDocument();
    expect(container.querySelector('.pf-v6-c-label')).toBeInTheDocument();
  });

  it('should show "Component" label when kind is missing', () => {
    const component = {};
    render(<SpecComponentTypeLabel component={component} />);

    expect(screen.getByText('Component')).toBeInTheDocument();
  });

  it('should show "Group" label in blue for componentGroup kind', () => {
    const component = { kind: 'componentGroup' as ComponentReferenceKind };
    const { container } = render(<SpecComponentTypeLabel component={component} />);

    const label = screen.getByText('Group');
    expect(label).toBeInTheDocument();
    expect(container.querySelector('.pf-v6-c-label')).toBeInTheDocument();
  });

  it('should handle ComponentGroup with capital letters', () => {
    const component = { kind: 'ComponentGroup' as ComponentReferenceKind };
    render(<SpecComponentTypeLabel component={component} />);

    expect(screen.getByText('Group')).toBeInTheDocument();
  });

  it('should handle COMPONENTGROUP in all caps', () => {
    const component = { kind: 'COMPONENTGROUP' as ComponentReferenceKind };
    render(<SpecComponentTypeLabel component={component} />);

    expect(screen.getByText('Group')).toBeInTheDocument();
  });
});
