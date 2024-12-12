import { githubAPIEndpoints } from '../../../utils/APIEndpoints';
import { APIHelper } from '../../../utils/APIHelper';
import { UIhelper } from '../../../utils/UIhelper';

type commitsRow = {
  name: string;
  component: string;
};

// Latest Commits List view page
export class LatestCommitsTabPage {
  editFile(
    gitRepo: string,
    filePath: string,
    commitMessage: string,
    updatedFileContentInBase64: string,
    fileSHA: string,
  ) {
    const owner = gitRepo.split('/')[3];
    const repoName = gitRepo.split('/')[4];
    const body = {
      message: `${commitMessage}`,
      content: `${updatedFileContentInBase64}`,
      sha: `${fileSHA}`,
    };
    APIHelper.githubRequest(
      'PUT',
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      body,
    ).then((result) => {
      cy.log(`${commitMessage}_SHA : ${result.body.commit.sha}`);
      Cypress.env(`${commitMessage}_SHA`, result.body.commit.sha);
    });
  }

  clickOnCommit(commit: string) {
    UIhelper.clickRowCellInTable('Commit List', commit, commit);
  }

  verifyCommitsPageTitleAndStatus(commitTitle: string) {
    cy.contains('h2', commitTitle).contains('Succeeded');
  }

  verifyCommitID(sha: string, repoLink: string) {
    UIhelper.verifyLabelAndValue('Commit', sha.slice(0, 7)).should(
      'have.attr',
      'href',
      `${repoLink}/commit/${sha}`,
    );
  }

  verifyNodesOnCommitOverview(nodes: string[]) {
    nodes.forEach((nodetext) => {
      UIhelper.verifyGraphNodes(nodetext);
    });
  }

  verifyLatestCommits(commitsRows: commitsRow[]) {
    commitsRows.forEach((commitsRow) => {
      UIhelper.verifyRowInTable('Commit List', commitsRow.name, [
        'main',
        commitsRow.component,
        Cypress.env('GH_USERNAME'),
        'Succeeded',
      ]);
    });
  }
}
