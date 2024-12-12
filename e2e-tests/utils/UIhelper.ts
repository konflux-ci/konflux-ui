import { UIhelperPO } from '../support/pageObjects/global-po';
import { Common } from './Common';

export class UIhelper {
  static checkTableHasRows(tableAriaLabel: string, text: string, occurrence: number) {
    cy.get(`[aria-label="${tableAriaLabel}"]`)
      .find('tr')
      .filter(`:contains(${text})`)
      .should('have.length', occurrence);
  }

  static clickTab(tabName: string, waitForLoad: boolean = true) {
    cy.contains(UIhelperPO.tabs, new RegExp(`^\\s*${tabName}\\s*$`)).click();
    if (waitForLoad) {
      Common.waitForLoad();
    }
  }

  static inputValueInTextBoxByLabelName(label: string, value: string) {
    return cy
      .contains(UIhelperPO.formGroupLabelText, new RegExp(`^\\s*${label}\\s*$`))
      .parentsUntil(UIhelperPO.formGroup)
      .eq(-1)
      .parent()
      .find('input')
      .clear()
      .type(value);
  }

  static selectValueInDropdownbyLabelName(label: string, value: string) {
    cy.contains(UIhelperPO.formGroup, label).within(() => {
      cy.get('div[data-test="dropdown"] > button').click();
      cy.contains('a', value).click().should('not.exist');
    });
  }

  static verifyValueInDropdownbyLabelName(label: string, value: string, disabled: boolean = false) {
    cy.contains(UIhelperPO.formGroup, label).within(() => {
      if (disabled) {
        cy.contains(UIhelperPO.dropdownToggle, value).should('be.visible').should('be.disabled');
      } else {
        cy.contains(UIhelperPO.dropdownToggle, value).should('be.visible').should('be.enabled');
      }
    });
  }

  static verifyLabelAndValue(label: string, value: string) {
    cy.log(`Validate Label : "${label}" should have value : "${value}"`);
    return cy
      .contains(UIhelperPO.listGroup_dt, new RegExp(`^\\s*${label}\\s*$`))
      .siblings('dd')
      .contains(new RegExp(`^\\s*${value}\\s*$`))
      .scrollIntoView()
      .should('be.visible');
  }

  static clickButton(label: string, options?: { invoke?: boolean; force?: boolean }) {
    if (options?.invoke) {
      return cy.contains(UIhelperPO.pf5_button, new RegExp(`^\\s*${label}\\s*$`)).invoke('click');
    } else if (options?.force) {
      return cy
        .contains(UIhelperPO.pf5_button, new RegExp(`^\\s*${label}\\s*$`))
        .click({ force: true });
    }
    return cy.contains(UIhelperPO.pf5_button, new RegExp(`^\\s*${label}\\s*$`)).click();
  }

  static clickLink(
    link: string,
    options?: { invoke?: boolean; force?: boolean; removeTarget?: boolean },
  ) {
    if (options?.invoke) {
      return cy.contains('a', new RegExp(`^\\s*${link}\\s*$`)).invoke('click');
    } else if (options?.force) {
      return cy.contains('a', new RegExp(`^\\s*${link}\\s*$`)).click({ force: true });
    } else if (options?.removeTarget) {
      return cy
        .contains('a', new RegExp(`^\\s*${link}\\s*$`))
        .invoke('removeAttr', 'target')
        .click();
    }
    return cy.contains('a', new RegExp(`^\\s*${link}\\s*$`)).click();
  }

  static getTableRow(tableAriaLabel: string, uniqueRowText: string | RegExp) {
    return cy
      .contains(UIhelperPO.tableRow(tableAriaLabel), uniqueRowText, { timeout: 60000 })
      .scrollIntoView();
  }

  static verifyRowInTable(
    tableAriaLabel: string,
    uniqueRowText: string | RegExp,
    rowValues: string[] | RegExp[],
  ) {
    UIhelper.getTableRow(tableAriaLabel, uniqueRowText).within(() => {
      rowValues.forEach((val) => {
        cy.contains(val).should('be.visible');
      });
    });
  }

  static clickRowCellInTable(
    tableAriaLabel: string,
    uniqueRowText: string | RegExp,
    cellTextToClick: string | RegExp,
  ) {
    UIhelper.getTableRow(tableAriaLabel, uniqueRowText).contains(cellTextToClick).click();
  }

  static verifyGraphNodes(nodeText: string, success = true) {
    cy.contains(UIhelperPO.graphNode, nodeText).within(() => {
      cy.get(success ? UIhelperPO.pipelineStatusSuccess : UIhelperPO.pipelineNode, {
        timeout: 60000,
      })
        .scrollIntoView()
        .should('be.visible');
    });
  }
}
