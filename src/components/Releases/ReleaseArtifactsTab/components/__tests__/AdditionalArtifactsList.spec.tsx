/* eslint-disable camelcase */
import { render, screen } from '@testing-library/react';
import { renderKeyValueList } from '../../utils/generic-key-value-rendering-utils';
import { AdditionalArtifactsList } from '../AdditionalArtifactsList';

jest.mock('../../utils/generic-key-value-rendering-utils', () => ({
  renderKeyValueList: jest.fn((data: Record<string, unknown>) =>
    Object.entries(data).map(([key, val]) => (
      <div key={key}>{`${key}: ${JSON.stringify(val)}`}</div>
    )),
  ),
}));

describe('AdditionalArtifactsList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if artifacts is undefined', () => {
    const { container } = render(<AdditionalArtifactsList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing if all artifacts are known keys', () => {
    const artifacts = {
      index_image: { target_index: 'value' },
      images: [],
      'github-release': { url: 'https://github.com/org/repo' },
    };

    const { container } = render(<AdditionalArtifactsList artifacts={artifacts} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only unknown artifact keys', () => {
    const artifacts = {
      index_image: { index_image: 'value2' },
      'custom-artifact': { foo: 'bar' },
      somethingExtra: 'value',
    };

    render(<AdditionalArtifactsList artifacts={artifacts} />);
    expect(screen.getByText(/Additional Release Artifacts/i)).toBeInTheDocument();
    expect(screen.getByText(/custom-artifact: {"foo":"bar"}/)).toBeInTheDocument();
    expect(screen.getByText(/somethingExtra: "value"/)).toBeInTheDocument();

    expect(renderKeyValueList).toHaveBeenCalledTimes(1);
    expect(renderKeyValueList).toHaveBeenCalledWith({
      'custom-artifact': { foo: 'bar' },
      somethingExtra: 'value',
    });
  });

  it('renders correctly when only one unknown artifact is present', () => {
    const artifacts = {
      index_image: {},
      another: 123,
    };

    render(<AdditionalArtifactsList artifacts={artifacts} />);
    expect(screen.getByText(/another: 123/)).toBeInTheDocument();
    expect(renderKeyValueList).toHaveBeenCalledTimes(1);
  });
});
