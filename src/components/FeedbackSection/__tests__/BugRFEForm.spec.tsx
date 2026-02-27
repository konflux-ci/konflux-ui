import { formikRenderer } from '~/unit-test-utils';
import BugRFEForm from '../components/BugRFEForm'
import { FeedbackSections } from '../consts';

const onCloseMock = jest.fn;
const setCurrentSectionMock = jest.fn;

describe('BugRFESection', () => {
  it('should show BugForm when current Section is BugSection', () => {
    const screen = formikRenderer(
      <BugRFEForm
        currentSection={FeedbackSections.BugSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    screen.getByText('Report a bug');
    screen.getByText(
      'Describe the bug you encountered. For urgent issues, use #konflux-user-forum instead',
    );
    screen.getByText('Title');
    screen.getByText('Please provide detailed description of the bug');
  });

  it('should show RFEForm when current Section is FeatureSection', () => {
    const screen = formikRenderer(
      <BugRFEForm
        currentSection={FeedbackSections.FeatureSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    screen.getByText('Request a new feature');
    screen.getByText(/Please provide detailed description of the feature/);
    screen.getByText('Title');
    screen.getByText(/Please provide detailed description of the bug/);
  });
});
