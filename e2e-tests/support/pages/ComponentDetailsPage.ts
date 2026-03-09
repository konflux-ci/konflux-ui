import { APIHelper } from '../../utils/APIHelper';
import { Common } from '../../utils/Common';
import { UIhelper } from '../../utils/UIhelper';
import { UIhelperPO } from '../pageObjects/global-po';
import { buildLogModalContentPO } from '../pageObjects/createApplication-po';
import {
  activityTabPO,
  compActivityPipelinerunsTabPO,
  componentDetailsPO,
} from '../pageObjects/pages-po';

export class ComponentDetailsPage {
  static openTab(tab: ComponentPageTabs) {
    UIhelper.clickTab(tab);
  }

  static verifyPipelineRunIsVisible(plrName: string) {
    cy.get(activityTabPO.clickTab).click();
    cy.get(compActivityPipelinerunsTabPO.clickTab).click();
    Common.waitForLoad();
    cy.contains(UIhelperPO.tableRow('Pipeline run List'), plrName, {
      // extended timeout: GitHub synchronization can occasionally take some time,
      // which causes PR creation to take longer.
      timeout: 300000, // 5min
    })
      .scrollIntoView()
      .should('be.visible');
    ComponentDetailsPage.openTab(ComponentPageTabs.detail);
    Common.waitForLoad();
  }

  static checkBuildImage() {
    cy.get(componentDetailsPO.buildImage)
      .invoke('val')
      .then((value) => {
        cy.exec(`skopeo inspect -f "Name: {{.Name}} Digest: {{.Digest}}" docker://${value}`, {
          timeout: 300000,
        })
          .its('exitCode')
          .should('eq', 0);
      });
  }

  static editComponent() {
    cy.contains('button', 'Edit deployment settings').click();
  }

  static checkSBOM() {
    cy.contains('.pf-v5-c-description-list__group', 'SBOM')
      .find('input')
      .should('contain.value', `cosign download sbom quay.io/`)
      .and('be.visible');
  }

  static openPodLogs() {
    cy.contains('button', 'View pod logs').click();
    cy.get(buildLogModalContentPO.modal).should('exist');
  }
}

export class DeploymentsTab {
  static verifyRoute(
    responseBodyContent: string,
    waitInterval: number = 10000,
    maxRetryNum: number = 10,
  ) {
    cy.get(componentDetailsPO.route)
      .invoke('attr', 'href')
      .then((route) => {
        APIHelper.checkResponseBodyAndStatusCode(
          route,
          responseBodyContent,
          waitInterval,
          0,
          maxRetryNum,
        );
      });
  }
}

export enum ComponentPageTabs {
  detail = 'Component details',
  activity = 'Activity',
  deployments = 'Deployments',
}
