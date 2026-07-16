export const stageLoginPO = {
  username: '#username',
  password: '#password',
  loginButton: '#submit',
  dex: `button[type="submit"]`,
  approveButton: 'input[name="approve"]',
  grantAccessClass: `.dex-btn-text`,
  grantAccessText: 'Grant Access',
};

export const localKonfluxLoginPO = {
  username: '#login',
  password: '#password',
  loginButton: '#submit-login',
  dex: `button[type="submit"]`,
};

export const openshiftLoginPO = {
  username: '#inputUsername',
  password: '#inputPassword',
  loginButton: 'button[type="submit"]',
  approveButton: 'input[name="approve"]',
  sidebar: '[id="page-sidebar"]',
};
