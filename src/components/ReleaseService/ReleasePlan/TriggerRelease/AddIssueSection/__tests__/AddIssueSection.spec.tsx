import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { formikRenderer } from '../../../../../../utils/test-utils';
import { IssueType } from '../AddIssueModal';
import { AddIssueSection } from '../AddIssueSection';

jest.useFakeTimers();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => (
      <a href={props.to} data-test={props['data-test']}>
        {props.children}
      </a>
    ),
    useNavigate: () => jest.fn(),
    useParams: jest.fn(),
  };
});

const AddIssue = (field: string, issueType: IssueType) => (
  <MemoryRouter>
    <FilterContextProvider filterParams={[field]}>
      <AddIssueSection field={field} issueType={issueType} />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('AddIssueSection for Bugs', () => {
  beforeEach(() => {});

  it('should show correct heading ', () => {
    formikRenderer(AddIssue('bug', IssueType.BUG));
    expect(
      screen.getByText('Are there any bug fixes you would like to add to this release?'),
    ).toBeVisible();
  });

  it('should show correct columns ', () => {
    formikRenderer(AddIssue('bug', IssueType.BUG));
    screen.getByText('Bug issue key');
    screen.getByText('URL');
    screen.getByText('Summary');
    screen.getByText('Last updated');
    screen.getByText('Status');
  });

  it('should render correct bug list ', () => {
    formikRenderer(AddIssue('bugs', IssueType.BUG), {
      bugs: [
        { id: 'bug-nodejs', url: 'http://url1.com' },
        { id: 'bug-java', url: 'http://url2.com' },
        { id: 'bug-python', url: 'http://url3.com' },
      ],
    });
    expect(screen.getByText('bug-nodejs')).toBeInTheDocument();
    expect(screen.getByText('bug-java')).toBeInTheDocument();
    expect(screen.getByText('bug-python')).toBeInTheDocument();
  });

  it('should have no search filter onLoad ', () => {
    formikRenderer(AddIssue('bugs', IssueType.BUG), {
      bugs: [
        { id: 'bug-nodejs', url: 'http://url1.com' },
        { id: 'bug-java', url: 'http://url2.com' },
        { id: 'bug-python', url: 'http://url3.com' },
      ],
    });
    const filterToolbar = screen.getByTestId('add-bugs-section-toolbar');
    const inputFilter = within(filterToolbar).getByPlaceholderText('Filter by name...');
    expect(inputFilter).toHaveValue('');
  });

  it('should filter bug list ', async () => {
    formikRenderer(AddIssue('bugs', IssueType.BUG), {
      bugs: [
        { id: 'bug-nodejs', url: 'http://url1.com' },
        { id: 'bug-java', url: 'http://url2.com' },
        { id: 'bug-python', url: 'http://url3.com' },
      ],
    });
    const tableBody = screen.getByTestId('issue-table-body');
    expect(tableBody.children.length).toBe(3);

    const filterToolbar = screen.getByTestId('add-bugs-section-toolbar');
    const inputFilter = within(filterToolbar).getByPlaceholderText('Filter by name...');
    fireEvent.change(inputFilter, { target: { value: 'java' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(tableBody.children.length).toBe(1);
      expect(tableBody.children[0].children[0].innerHTML).toBe('bug-java');
    });
  });

  it('should show emptyState ', () => {
    formikRenderer(AddIssue('bugs', IssueType.BUG), {
      bugs: [],
    });
    expect(screen.getByText('No Bugs found'));
  });

  it('should show filteredEmptyState ', async () => {
    formikRenderer(AddIssue('bugs', IssueType.BUG), {
      bugs: [
        { id: 'bug-nodejs', url: 'http://url1.com' },
        { id: 'bug-java', url: 'http://url2.com' },
        { id: 'bug-python', url: 'http://url3.com' },
      ],
    });

    const filterToolbar = screen.getByTestId('add-bugs-section-toolbar');
    const inputFilter = within(filterToolbar).getByPlaceholderText('Filter by name...');
    fireEvent.change(inputFilter, { target: { value: 'no-match' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(
        screen.getByText('No results match this filter criteria. Clear all filters and try again.'),
      );
    });
  });
});

describe('AddIssueSection for CVEs', () => {
  beforeEach(() => {});

  it('should show correct heading ', () => {
    formikRenderer(AddIssue('cve', IssueType.CVE));
    expect(
      screen.getByText('Are there any CVEs you would like to add to this release?'),
    ).toBeVisible();
  });

  it('should show correct columns ', () => {
    formikRenderer(AddIssue('cve', IssueType.CVE));
    screen.getByText('CVE key');
    screen.getByText('Components');
    screen.getByText('Summary');
    screen.getByText('Last updated');
    screen.getByText('Status');
  });

  it('should render correct cve list ', () => {
    formikRenderer(AddIssue('cves', IssueType.CVE), {
      cves: [
        {
          key: 'cve-nodejs',
          components: [{ name: 'cmp1' }, { name: 'cmp2', packages: ['a', 'b'] }],
        },
        {
          key: 'cve-java',
          components: [{ name: 'cmp4' }, { name: 'cmp5', packages: ['a', 'b'] }],
        },
        {
          key: 'cve-python',
          components: [{ name: 'cmp7' }, { name: 'cmp8', packages: ['a', 'b'] }],
        },
      ],
    });
    expect(screen.getByText('cve-nodejs')).toBeInTheDocument();
    expect(screen.getByText('cmp1')).toBeInTheDocument();
    expect(screen.getByText('cmp2')).toBeInTheDocument();
    expect(screen.getByText('cve-java')).toBeInTheDocument();
    expect(screen.getByText('cmp4')).toBeInTheDocument();
    expect(screen.getByText('cmp5')).toBeInTheDocument();
    expect(screen.getByText('cve-python')).toBeInTheDocument();
    expect(screen.getByText('cmp7')).toBeInTheDocument();
    expect(screen.getByText('cmp8')).toBeInTheDocument();
  });

  it('should render - when data is missing', () => {
    formikRenderer(AddIssue('cves', IssueType.CVE), {
      cves: [{ key: 'cve-nodejs', url: 'url1' }],
    });
    expect(screen.getByTestId('issue-summary').innerHTML).toBe('-');
    expect(screen.getByTestId('issue-status').innerHTML).toBe('-');
  });

  it('should filter cves list ', async () => {
    formikRenderer(AddIssue('cves', IssueType.CVE), {
      cves: [
        {
          key: 'cve-nodejs',
          components: [{ name: 'cmp1' }, { name: 'cmp2', packages: ['a', 'b'] }],
        },
        {
          key: 'cve-java',
          components: [{ name: 'cmp3' }, { name: 'cmp5', packages: ['a', 'b'] }, { name: 'cmp6' }],
        },
        {
          key: 'cve-python',
          components: [{ name: 'cmp4' }, { name: 'cmp2', packages: ['a', 'b'] }],
        },
      ],
    });
    const tableBody = screen.getByTestId('issue-table-body');
    expect(tableBody.children.length).toBe(3);

    const filterToolbar = screen.getByTestId('add-cves-section-toolbar');
    const inputFilter = within(filterToolbar).getByPlaceholderText('Filter by name...');
    fireEvent.change(inputFilter, { target: { value: 'java' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(tableBody.children.length).toBe(1);
      expect(tableBody.children[0].children[0].innerHTML).toBe('cve-java');
    });
  });

  it('should show emptyState ', () => {
    formikRenderer(AddIssue('cves', IssueType.CVE), {
      cves: [],
    });
    expect(screen.getByText('No CVEs found'));
  });

  it('should show filteredEmptyState ', async () => {
    formikRenderer(AddIssue('cves', IssueType.CVE), {
      cves: [
        {
          key: 'cve-nodejs',
          components: [{ name: 'cmp1' }, { name: 'cmp2', packages: ['a', 'b'] }],
        },
        {
          key: 'cve-java',
          components: [{ name: 'cmp3' }, { name: 'cmp5', packages: ['a', 'b'] }, { name: 'cmp6' }],
        },
        {
          key: 'cve-python',
          components: [{ name: 'cmp4' }, { name: 'cmp2', packages: ['a', 'b'] }],
        },
      ],
    });

    const filterToolbar = screen.getByTestId('add-cves-section-toolbar');
    const inputFilter = within(filterToolbar).getByPlaceholderText('Filter by name...');
    fireEvent.change(inputFilter, { target: { value: 'no-match' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(
        screen.getByText('No results match this filter criteria. Clear all filters and try again.'),
      );
    });
  });
});
