import { render, screen } from '@testing-library/react';
import { ComponentGroupKind } from '~/types';
import ComponentGroupPromotionStatus from '../ComponentGroupPromotionStatus';

const createMockGroup = (
  globalCandidateList?: Array<{ name: string; lastPromotedImage?: string }>,
): ComponentGroupKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1beta2',
    kind: 'ComponentGroup',
    metadata: { name: 'test-group', namespace: 'test-ns' },
    spec: { components: [] },
    status: globalCandidateList ? { globalCandidateList } : undefined,
  }) as ComponentGroupKind;

describe('ComponentGroupPromotionStatus', () => {
  it('should show "-" when globalCandidateList is empty', () => {
    const group = createMockGroup([]);

    render(<ComponentGroupPromotionStatus group={group} />);

    expect(screen.getByTestId('component-group-no-promotions')).toHaveTextContent('-');
  });

  it('should show "-" when globalCandidateList is missing', () => {
    const group = createMockGroup(undefined);

    render(<ComponentGroupPromotionStatus group={group} />);

    expect(screen.getByTestId('component-group-no-promotions')).toHaveTextContent('-');
  });

  it('should show "-" when status is missing', () => {
    const group: ComponentGroupKind = {
      apiVersion: 'appstudio.redhat.com/v1beta2',
      kind: 'ComponentGroup',
      metadata: { name: 'test-group', namespace: 'test-ns' },
      spec: { components: [] },
    };

    render(<ComponentGroupPromotionStatus group={group} />);

    expect(screen.getByTestId('component-group-no-promotions')).toHaveTextContent('-');
  });

  it('should show green label when all components are promoted', () => {
    const group = createMockGroup([
      { name: 'comp1', lastPromotedImage: 'image1' },
      { name: 'comp2', lastPromotedImage: 'image2' },
      { name: 'comp3', lastPromotedImage: 'image3' },
    ]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('3/3 promoted');
    expect(label).toHaveClass('pf-v6-c-label');
    expect(label).toHaveClass('pf-m-green');
  });

  it('should show grey label when no components are promoted', () => {
    const group = createMockGroup([{ name: 'comp1' }, { name: 'comp2' }, { name: 'comp3' }]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('0/3 promoted');
    expect(label).toHaveClass('pf-v6-c-label');
    // PatternFly v6 doesn't add a color modifier for grey labels
    expect(label).not.toHaveClass('pf-m-green');
    expect(label).not.toHaveClass('pf-m-orange');
  });

  it('should show orange label when some components are promoted', () => {
    const group = createMockGroup([
      { name: 'comp1', lastPromotedImage: 'image1' },
      { name: 'comp2' },
      { name: 'comp3', lastPromotedImage: 'image3' },
    ]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('2/3 promoted');
    expect(label).toHaveClass('pf-v6-c-label');
    expect(label).toHaveClass('pf-m-orange');
  });

  it('should show orange label for 1 out of many promoted', () => {
    const group = createMockGroup([
      { name: 'comp1', lastPromotedImage: 'image1' },
      { name: 'comp2' },
      { name: 'comp3' },
      { name: 'comp4' },
      { name: 'comp5' },
    ]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('1/5 promoted');
    expect(label).toHaveClass('pf-v6-c-label');
    expect(label).toHaveClass('pf-m-orange');
  });

  it('should show green label for single promoted component', () => {
    const group = createMockGroup([{ name: 'comp1', lastPromotedImage: 'image1' }]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('1/1 promoted');
    expect(label).toHaveClass('pf-v6-c-label');
    expect(label).toHaveClass('pf-m-green');
  });

  it('should show grey label for single non-promoted component', () => {
    const group = createMockGroup([{ name: 'comp1' }]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('0/1 promoted');
    expect(label).toHaveClass('pf-v6-c-label');
    // PatternFly v6 doesn't add a color modifier for grey labels
    expect(label).not.toHaveClass('pf-m-green');
    expect(label).not.toHaveClass('pf-m-orange');
  });

  it('should handle empty string as lastPromotedImage (treated as not promoted)', () => {
    const group = createMockGroup([
      { name: 'comp1', lastPromotedImage: '' },
      { name: 'comp2', lastPromotedImage: 'image2' },
    ]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('1/2 promoted');
    expect(label).toHaveClass('pf-m-orange');
  });

  it('should count all promoted correctly with mixed states', () => {
    const group = createMockGroup([
      { name: 'comp1', lastPromotedImage: 'image1' },
      { name: 'comp2', lastPromotedImage: 'image2' },
      { name: 'comp3' },
      { name: 'comp4', lastPromotedImage: 'image4' },
      { name: 'comp5' },
      { name: 'comp6', lastPromotedImage: 'image6' },
    ]);

    render(<ComponentGroupPromotionStatus group={group} />);

    const label = screen.getByTestId('component-group-promotion-status');
    expect(label).toHaveTextContent('4/6 promoted');
    expect(label).toHaveClass('pf-m-orange');
  });
});
