import { render, screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ReleaseArtifactsImages } from '../../../../types';
import { ReleaseArtifactsListExpandedRow } from '../ReleaseArtifactsListExpandedRow';

const mockedImage: ReleaseArtifactsImages = {
  arches: ['amd64'],
  name: 'acs-fleet-manager',
  oses: ['linux'],
  shasum: 'sha256:1e3f72a55ee01a1b3c44bcd30aa04215413745742bbc321ab53fd8e8e07fb807',
  urls: [
    'quay.io/redhat-services-prod/acscs-rhacs-tenant/acscs-main/acs-fleet-manager:1e3f72a55ee01a1b3c44bcd30aa04215413745742bbc321ab53fd8e8e07fb807',
    'quay.io/redhat-services-prod/acscs-rhacs-tenant/acscs-main/acs-fleet-manager:d179f0c',
    'quay.io/redhat-services-prod/acscs-rhacs-tenant/acscs-main/acs-fleet-manager:d179f0c64ac6f2768e789a3ec590ba1356a995e6',
    'quay.io/redhat-services-prod/acscs-rhacs-tenant/acscs-main/acs-fleet-manager:latest',
  ],
};

describe('ReleaseArtifactsListExpandedRow.spec', () => {
  mockUseNamespaceHook('test-ns');

  it('should render the component', () => {
    render(<ReleaseArtifactsListExpandedRow releaseArtifactImage={mockedImage} />);
    screen.getByText('Additional URLs');
    screen.getByText(
      'quay.io/redhat-services-prod/acscs-rhacs-tenant/acscs-main/acs-fleet-manager:1e3f72a55ee01a1b3c44bcd30aa04215413745742bbc321ab53fd8e8e07fb807',
    );
    screen.getByText(
      'quay.io/redhat-services-prod/acscs-rhacs-tenant/acscs-main/acs-fleet-manager:latest',
    );
  });

  it('should not render the component', () => {
    render(<ReleaseArtifactsListExpandedRow releaseArtifactImage={undefined} />);
    expect(screen.queryByText('Additional URLs')).not.toBeInTheDocument();
  });
});
