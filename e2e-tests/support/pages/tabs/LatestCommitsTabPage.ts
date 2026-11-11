import { APIHelper } from '../../../utils/APIHelper';
import { UIhelper } from '../../../utils/UIhelper';

type commitsRow = {
  name: string;
  component: string;
  status?: string | RegExp;
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
      Cypress.expose(`${commitMessage}_SHA`, result.body.commit.sha);
    });
  }

  clickOnCommit(commit: string) {
    UIhelper.clickRowCellInTable('Commit List', commit, commit);
  }

  verifyCommitsPageTitleAndStatus(commitTitle: string, status: string | RegExp = 'Succeeded') {
    cy.contains('h2', commitTitle).contains(status);
  }

  verifyCommitID(sha: string, repoLink: string) {
    const shortSha = sha.slice(0, 7);
    UIhelper.verifyLabelAndValue('Commit', shortSha);
    cy.get(`[data-test="commit-label-${shortSha}"]`).should(
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
        Cypress.expose('GH_USERNAME'),
        commitsRow.status ?? 'Succeeded',
      ]);
    });
  }

  waitForCommitInList(commitName: string, timeout: number = 180000) {
    cy.contains('[aria-label="Commit List"] tr', commitName, { timeout })
      .scrollIntoView()
      .should('be.visible');
  }
}
