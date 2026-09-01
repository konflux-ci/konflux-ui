import { defineConfig } from 'cypress';
import * as fs from 'fs-extra';
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');
const codeCoverageTask = require('@cypress/code-coverage/task');

export default defineConfig({
  projectId: process.env.CYPRESS_PROJECT_ID,
  defaultCommandTimeout: 40000,
  execTimeout: 150000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  animationDistanceThreshold: 20,
  chromeWebSecurity: false,
  viewportWidth: 1280,
  viewportHeight: 720,
  video: true,
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'cypress-mochawesome-reporter, spec, mocha-junit-reporter',
    mochaJunitReporterReporterOptions: {
      mochaFile: 'cypress/junit-[hash].xml',
    },
    cypressMochawesomeReporterReporterOptions: {
      charts: true,
      embeddedScreenshots: false,
      ignoreVideos: true,
      reportDir: 'cypress',
      inlineAssets: true,
    },
  },
  e2e: {
    supportFile: 'support/commands/index.ts',
    specPattern: 'tests/*.spec.ts',
    testIsolation: false,
    excludeSpecPattern:
      process.env.CYPRESS_PERIODIC_RUN_STAGE ||
      process.env.GH_COMMENTBODY?.toLowerCase() === '[test]'
        ? 'tests/*-private-git-*' // TODO: remove once https://issues.redhat.com/browse/RHTAPBUGS-111 is resolved
        : 'tests/{advanced-happy-path*,private-basic*,*-private-git-*}',
    setupNodeEvents(on, config) {
      const isStudioMode = Boolean(config.env.SKIP_GLOBAL_SETUP);

      // Code coverage plugin - must be registered first (breaks Cypress Studio recording)
      if (process.env.CYPRESS_PERIODIC_RUN_STAGE !== 'true' && !isStudioMode) {
        codeCoverageTask(on, config);
      } else if (isStudioMode) {
        console.log('Skipping code coverage for Cypress Studio mode');
      } else {
        console.log('Skipping code coverage for periodic run stage');
      }

      if (!isStudioMode) {
        require('cypress-mochawesome-reporter/plugin')(on);
        require('cypress-high-resolution')(on, config);

        const logOptions = {
          outputRoot: `${config.projectRoot}/cypress`,
          outputTarget: {
            'cypress-log.txt': 'txt',
          },
          printLogsToFile: 'always',
        };
        require('cypress-terminal-report/src/installLogsPrinter')(on, logOptions);
      }
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        logTable(data) {
          console.table(data);
          return null;
        },
        readFileIfExists(filename: string) {
          if (fs.existsSync(filename)) {
            return fs.readFileSync(filename, 'utf8');
          }
          return null;
        },
        deleteFile(filename: string) {
          if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
          }
          return null;
        },
      });

      if (!isStudioMode) {
        on('before:run', async (details) => {
          // cypress-mochawesome-reporter
          await beforeRunHook(details);
        });

        on('after:run', async () => {
          // cypress-mochawesome-reporter
          await afterRunHook();
        });
      }

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--disable-extensions');
        }
        return launchOptions;
      });

      (on as any)(
        'after:spec',
        async (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => {
          // cypress-mochawesome-reporter
          if (results.stats?.failures > 0 && !isStudioMode) {
            console.log(
              `A total of ${results.stats.failures} tests failed, DOM content saved at './cypress/saved-doms'`,
            );
          }
          return null;
        },
      );

      const defaultValues: { [key: string]: string | boolean } = {
        KONFLUX_BASE_URL: 'https://localhost:8080',
        USERNAME: 'user2@konflux.dev',
        PASSWORD: 'password',
        GH_USERNAME: 'hac-test',
        GH_REPO_OWNER: 'redhat-hac-qe',
        GH_PASSWORD: '',
        GH_TOKEN: '',
        GH_SETUP_KEY: '',
        KUBECONFIG: '~/.kube/appstudio-config',
        CLEAN_NAMESPACE: 'false',
        LOCAL_CLUSTER: false,
        LOGIN_PROVIDER: '',
        PERIODIC_RUN_STAGE: false,
        PIPELINE: 'docker-build-oci-ta-min',
        SOURCE_REPO_OWNER: 'hac-test',
        SOURCE_REPO_NAME: 'devfile-sample-code-with-quarkus',
        resolution: 'high',
        REMOVE_APP_ON_FAIL: false,
        SKIP_GLOBAL_SETUP: false,
        SNYK_TOKEN: '',
        SSO_URL: 'https://sso.redhat.com/auth/',
      };

      for (const key in defaultValues) {
        if (!config.env[key]) {
          config.env[key] = defaultValues[key];
        }
      }

      if (config.env.GH_TOKEN == '') {
        throw new Error('GH_TOKEN variable needs to be set to run a test.');
      }

      config.env.HAC_WORKSPACE = config.env.USERNAME.toLowerCase();
      if (!config.env.HAC_NAMESPACE) {
        if (config.env.LOCAL_CLUSTER === true) {
          config.env.HAC_NAMESPACE = `default-tenant`;
        } else {
          config.env.HAC_NAMESPACE = `${config.env.HAC_WORKSPACE}-tenant`;
        }
      }

      return config;
    },
  },
});
