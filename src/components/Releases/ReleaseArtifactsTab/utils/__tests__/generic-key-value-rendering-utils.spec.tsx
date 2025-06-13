/* eslint-disable camelcase */
import { render, screen } from '@testing-library/react';
import { renderKeyValueList } from '../generic-key-value-rendering-utils';

describe('renderKeyValueList', () => {
  it('renders simple key-value pairs', () => {
    render(<>{renderKeyValueList({ name: 'Rodrigo' })}</>);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText(/Rodrigo/i)).toBeInTheDocument();
  });

  it('renders URLs as external links', () => {
    render(<>{renderKeyValueList({ docs: 'https://example.com' })}</>);
    const link = screen.getByTestId('external-link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveTextContent('https://example.com');
  });

  it('converts quay.io URLs with getImageLink', () => {
    render(<>{renderKeyValueList({ image: 'quay.io/myrepo/myimage:tag' })}</>);
    const link = screen.getByTestId('external-link');
    expect(link).toHaveAttribute('href', 'https://quay.io/myrepo/myimage:tag');
  });

  it('renders nested object structures', () => {
    render(<>{renderKeyValueList({ metadata: { version: '1.0.0', commit: 'abc123' } })}</>);
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText(/Version/i)).toBeInTheDocument();
    expect(screen.getByText(/1.0.0/i)).toBeInTheDocument();
    expect(screen.getByText(/Commit/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123/i)).toBeInTheDocument();
  });

  it('renders array of primitive values', () => {
    render(<>{renderKeyValueList({ items: ['a', 'b', 'c'] })}</>);
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText(/a/i)).toBeInTheDocument();
    expect(screen.getByText(/b/i)).toBeInTheDocument();
    expect(screen.getByText(/c/i)).toBeInTheDocument();
  });

  it('renders array of objects', () => {
    const arr = [
      { name: 'file1.txt', size: '2MB' },
      { name: 'file2.txt', size: '3MB' },
    ];
    render(<>{renderKeyValueList({ files: arr })}</>);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getAllByText(/Name/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/file1.txt/i)).toBeInTheDocument();
    expect(screen.getByText(/file2.txt/i)).toBeInTheDocument();
  });

  it('handles null values gracefully', () => {
    render(<>{renderKeyValueList({ nullValue: null })}</>);
    expect(screen.getByText('Null value')).toBeInTheDocument();
  });

  it('renders deeply nested structures', () => {
    const data = {
      build: {
        metadata: {
          commit: 'abc123',
          tag: 'v1.2.3',
        },
      },
    };
    render(<>{renderKeyValueList({ 'Build Info': data })}</>);
    expect(screen.getByText('Build info')).toBeInTheDocument();
    expect(screen.getByText(/commit/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123/i)).toBeInTheDocument();
  });

  it('handles key with several "_" (underscores) gracefully', () => {
    render(<>{renderKeyValueList({ weird_______key: 'testing' })}</>);
    expect(screen.getByText('Weird key')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });
});
