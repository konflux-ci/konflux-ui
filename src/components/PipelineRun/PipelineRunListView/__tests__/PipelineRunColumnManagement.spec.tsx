import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PipelineRunColumnManagement from '../PipelineRunColumnManagement';
import { PipelineRunColumnKey, defaultStandardColumns } from '../PipelineRunListHeader';

describe('PipelineRunColumnManagement', () => {
  const mockOnClose = jest.fn();
  const mockOnVisibleColumnsChange = jest.fn();

  const visibleColumns = new Set<PipelineRunColumnKey>(['name', 'started', 'status', 'kebab']);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with correct title and description', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    expect(screen.getByText('Manage pipeline run columns')).toBeInTheDocument();
    expect(screen.getByText('Selected columns will be displayed in the pipeline run table.')).toBeInTheDocument();
  });

  it('displays checkboxes for manageable columns', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    // Should show manageable columns (not 'name' and 'kebab')
    expect(screen.getByLabelText('Started')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Component')).toBeInTheDocument();
    expect(screen.getByLabelText('Trigger')).toBeInTheDocument();
    expect(screen.getByLabelText('Reference')).toBeInTheDocument();
    
    // Should not show non-hidable columns
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('')).not.toBeInTheDocument();
  });

  it('has correct initial checked state based on visible columns', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    expect(screen.getByLabelText('Started')).toBeChecked();
    expect(screen.getByLabelText('Status')).toBeChecked();
    expect(screen.getByLabelText('Duration')).not.toBeChecked();
    expect(screen.getByLabelText('Type')).not.toBeChecked();
  });

  it('toggles column visibility when checkbox is clicked', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    // Toggle 'Duration' column
    fireEvent.click(screen.getByLabelText('Duration'));
    
    // Click Save button
    fireEvent.click(screen.getByText('Save'));

    expect(mockOnVisibleColumnsChange).toHaveBeenCalledWith(
      new Set(['name', 'started', 'status', 'kebab', 'duration']),
    );
  });

  it('resets to default columns when reset button is clicked', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    // Click Reset button
    fireEvent.click(screen.getByText('Reset to default'));
    
    // Click Save button
    fireEvent.click(screen.getByText('Save'));

    expect(mockOnVisibleColumnsChange).toHaveBeenCalledWith(defaultStandardColumns);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Save button is clicked', () => {
    render(
      <PipelineRunColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
      />,
    );

    fireEvent.click(screen.getByText('Save'));
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 