import { configure, fireEvent, screen } from '@testing-library/react';
import { formikRenderer } from '../../../utils/test-utils';
import {
  MultiSelectComponentsDropdown,
  SingleSelectComponentDropdown,
} from '../ComponentRelationshipDropdowns';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'id' });

describe('SingleSelectComponentDropdown', () => {
  it('should render component dropdown', () => {
    formikRenderer(<SingleSelectComponentDropdown name="singleSelect" componentNames={['a']} />, {
      singleSelect: '',
    });
    screen.getByText('Select a component');
  });

  it('should render component items and select items', () => {
    formikRenderer(
      <SingleSelectComponentDropdown name="singleSelect" componentNames={['a', 'b']} />,
      {
        singleSelect: '',
      },
    );
    expect(screen.queryByText('b')).not.toBeInTheDocument();
    screen.getByText('Select a component');
    fireEvent.click(screen.getByTestId('toggle-component-menu'));
    screen.getAllByRole('menuitem');
    fireEvent.click(screen.getByText('b'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByText('Select a component')).not.toBeInTheDocument();
    screen.getByText('b');
  });

  it('should render component items with disabled items', () => {
    formikRenderer(
      <SingleSelectComponentDropdown
        name="singleSelect"
        componentNames={['a', 'b']}
        disableMenuItem={(i) => i === 'b'}
      />,
      {
        singleSelect: '',
      },
    );
    expect(screen.queryByText('b')).not.toBeInTheDocument();
    screen.getByText('Select a component');
    fireEvent.click(screen.getByTestId('toggle-component-menu'));
    const menu = screen.getByRole('menu');
    const disabledItem = menu.querySelectorAll('.pf-m-disabled');
    expect(disabledItem).toHaveLength(1);
    expect(disabledItem[0].querySelector('.pf-v5-c-menu__item-text').innerHTML).toEqual('b');
  });

  it('should render items in sorted order', () => {
    formikRenderer(
      <SingleSelectComponentDropdown name="singleSelect" componentNames={['b', 'a', 'c']} />,
      {
        singleSelect: '',
      },
    );
    fireEvent.click(screen.getByTestId('toggle-component-menu'));
    const menuItems = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(menuItems).toEqual(['a', 'b', 'c']);
  });

  it('should filter components based on search input', () => {
    formikRenderer(
      <SingleSelectComponentDropdown name="singleSelect" componentNames={['test1', 'test2']} />,
      {
        singleSelect: '',
      },
    );
    fireEvent.click(screen.getByTestId('toggle-component-menu'));
    const searchInput = screen.getByPlaceholderText('Search components...');
    fireEvent.change(searchInput, { target: { value: '1' } });
    expect(screen.getByText('test1')).toBeInTheDocument();
  });
});

describe('MultiSelectComponentDropdown', () => {
  it('should render component dropdown', () => {
    formikRenderer(
      <MultiSelectComponentsDropdown groupedComponents={{ c: ['a', 'b'] }} name="multiSelect" />,
      { multiSelect: '' },
    );
    screen.getByText('Choose components to nudge');
  });

  it('should select all item from menu', () => {
    formikRenderer(
      <MultiSelectComponentsDropdown groupedComponents={{ c: ['a', 'b'] }} name="multiSelect" />,
      { multiSelect: '' },
    );
    screen.getByText('Choose components to nudge');
    const button = screen.getByTestId('toggle-component-menu');
    fireEvent.click(button);
    expect(button.querySelector('.pf-m-read')).not.toBeInTheDocument();
    const menu = screen.getAllByRole('menuitem');
    const selectAllButton = menu[0].querySelector('input');
    fireEvent.click(selectAllButton);
    expect(button.querySelector('.pf-m-read')).toBeInTheDocument();
    expect(button.querySelector('.pf-m-read').innerHTML).toEqual('2');
  });

  it('should select/unselect all item from menu', () => {
    formikRenderer(
      <MultiSelectComponentsDropdown groupedComponents={{ c: ['a', 'b'] }} name="multiSelect" />,
      { multiSelect: '' },
    );
    screen.getByText('Choose components to nudge');
    const button = screen.getByTestId('toggle-component-menu');
    fireEvent.click(button);
    expect(button.querySelector('.pf-m-read')).not.toBeInTheDocument();
    const menu = screen.getAllByRole('menuitem');
    const selectAllButton = menu[0].querySelector('input');
    fireEvent.click(selectAllButton);
    expect(button.querySelector('.pf-m-read')).toBeInTheDocument();
    expect(button.querySelector('.pf-m-read').innerHTML).toEqual('2');
    fireEvent.click(selectAllButton);
    expect(button.querySelector('.pf-m-read')).not.toBeInTheDocument();
  });

  it('should not select disabled menu item', () => {
    formikRenderer(
      <MultiSelectComponentsDropdown
        groupedComponents={{ c: ['a', 'b'] }}
        name="multiSelect"
        sourceComponentName="a"
      />,
      { multiSelect: '' },
    );
    screen.getByText('Choose components to nudge');
    const button = screen.getByTestId('toggle-component-menu');
    fireEvent.click(button);
    expect(button.querySelector('.pf-m-read')).not.toBeInTheDocument();
    const menu = screen.getAllByRole('menuitem');
    const selectAllButton = menu[0].querySelector('input');
    fireEvent.click(selectAllButton);
    expect(button.querySelector('.pf-m-read')).toBeInTheDocument();
    expect(button.querySelector('.pf-m-read').innerHTML).toEqual('1');
    const disabledItem = screen.getAllByRole('menu')[1].querySelectorAll('.pf-m-disabled');
    expect(disabledItem).toHaveLength(1);
  });

  it('should render grouped components in sorted order', () => {
    formikRenderer(
      <MultiSelectComponentsDropdown
        groupedComponents={{ Group1: ['aa', 'ab', 'ac'] }}
        name="multiSelect"
      />,
      { multiSelect: [] },
    );
    fireEvent.click(screen.getByTestId('toggle-component-menu'));
    const menuItems = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(menuItems).toEqual(['Select all', 'aa', 'ab', 'ac']);
  });

  it('should filter grouped components based on search input', () => {
    formikRenderer(
      <MultiSelectComponentsDropdown
        groupedComponents={{ Group1: ['test1', 'example', 'sample'] }}
        name="multiSelect"
      />,
      { multiSelect: [] },
    );
    fireEvent.click(screen.getByTestId('toggle-component-menu'));
    const searchInput = screen.getByPlaceholderText('Search components...');
    fireEvent.change(searchInput, { target: { value: 'exa' } });
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.queryByText('test1')).not.toBeInTheDocument();
    expect(screen.queryByText('sample')).not.toBeInTheDocument();
  });
});
