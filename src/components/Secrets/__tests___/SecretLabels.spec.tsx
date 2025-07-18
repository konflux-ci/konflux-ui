import { render } from '@testing-library/react';
import { SecretLabels } from '../SecretsListView/SecretLabels';

describe('SecretLabels', () => {
  it('should render the labels', () => {
    const r = render(
      <SecretLabels
        labels={['label1', 'label2']}
        index={0}
        expanded={false}
        handleToggle={() => {}}
      />,
    );

    expect(r.getByText('label1')).toBeInTheDocument();
    expect(r.getByText('label2')).toBeInTheDocument();
  });

  it('should show toggle button when labels are more than maxLabels', () => {
    const r = render(
      <SecretLabels
        labels={['label1', 'label2', 'label3', 'label4', 'label5']}
        index={0}
        expanded={false}
        handleToggle={() => {}}
      />,
    );
    r.debug();
    expect(r.getByText('label1')).toBeInTheDocument();
    expect(r.getByText('label2')).toBeInTheDocument();
    expect(r.queryByText('label5')).not.toBeInTheDocument();
    expect(r.getByText('Show more')).toBeInTheDocument();
  });

  it('should show less button when labels are more than maxLabels and expanded is true', () => {
    const r = render(
      <SecretLabels
        labels={['label1', 'label2', 'label3', 'label4']}
        index={0}
        expanded={true}
        handleToggle={() => {}}
      />,
    );

    expect(r.getByText('label1')).toBeInTheDocument();
    expect(r.getByText('label2')).toBeInTheDocument();
    expect(r.getByText('label4')).toBeInTheDocument();
    expect(r.getByText('Show less')).toBeInTheDocument();
  });

  it('should call handleToggle when toggle button is clicked', () => {
    const handleToggle = jest.fn();
    const r = render(
      <SecretLabels
        labels={['label1', 'label2', 'label3', 'label4']}
        index={0}
        expanded={false}
        handleToggle={handleToggle}
      />,
    );

    r.getByText('Show more').click();
    expect(handleToggle).toHaveBeenCalledWith(0);
  });
});
