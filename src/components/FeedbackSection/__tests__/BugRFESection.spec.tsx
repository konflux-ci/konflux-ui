import BugRFESection from '../components/BugRFESection';
import { FeedbackSections } from '../consts';
import { formikRenderer } from '~/unit-test-utils';

describe('BugRFESection', () => {
  it('should show BugForm when current Section is BugSection', () => {
    const screen = formikRenderer(<BugRFESection currentSection={FeedbackSections.BugSection} />);
    screen.getByText('Report a bug');
    screen.getByText(
      'Describe the bug you encountered. For urgent issues, use #konflux-user-forum instead',
    );
    screen.getByText('Title');
    screen.getByText('Please provide detailed description of the bug');
  });

  it('should show RFEForm when current Section is FeatureSection', () => {
    const screen = formikRenderer(
      <BugRFESection currentSection={FeedbackSections.FeatureSection} />,
    );
    screen.getByText('Request a new feature');
    screen.getByText(/Please provide detailed description of the feature/);
    screen.getByText('Title');
    screen.getByText(/Please provide detailed description of the bug/);
  });
});
