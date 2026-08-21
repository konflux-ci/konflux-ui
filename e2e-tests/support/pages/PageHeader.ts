import { pageHeaderPO } from '../pageObjects/pageHeader-po';

export enum Themes {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export class ThemeSwitcher {
  static clickOnThemeSwitcher() {
    cy.get(pageHeaderPO.themeDropdownToggle).should('be.visible').click();
    cy.get(pageHeaderPO.themeDropdown).should('be.visible');
  }

  static switchTheme(from: Themes, to: Themes) {
    cy.get(pageHeaderPO.themeOption(to)).click();

    // The page theme changed to the selected theme.
    cy.get(pageHeaderPO.htmlTheme).should('not.have.class', `pf-v6-theme-${from}`);

    // Selectors are at the correct row.
    cy.get(pageHeaderPO.themeOptionButton(from)).should('not.have.class', pageHeaderPO.selected);
    cy.get(pageHeaderPO.themeOptionButton(to)).should('have.class', pageHeaderPO.selected);
  }
}

export enum Contrasts {
  DEFAULT = 'default',
  HIGH = 'high',
  SYSTEM = 'system',
}

export class ContrastSwitcher {
  static switchContrast(from: Contrasts, to: Contrasts) {
    cy.get(pageHeaderPO.contrastOption(to)).click();

    // The page contrast changed to the selected contrast.
    cy.get(pageHeaderPO.htmlTheme).should('not.have.class', `pf-v6-theme-${from}-contrast`);

    // Selectors are at the correct row.
    cy.get(pageHeaderPO.contrastOptionButton(from)).should('not.have.class', pageHeaderPO.selected);
    cy.get(pageHeaderPO.contrastOptionButton(to)).should('have.class', pageHeaderPO.selected);
  }
}
