import { defineConfig } from 'cypress';
import * as fs from 'fs-extra';
import * as glob from 'glob';
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');
function deleteLaunchFiles() {
  const getLaunchTempFiles = () => {
    return glob.sync('rplaunch*.tmp');
  };
  const deleteTempFile = (filename) => {
    fs.unlinkSync(filename);
  };
  const files = getLaunchTempFiles();
  files.forEach(deleteTempFile);
}

export default defineConfig({
  defaultCommandTimeout: 40000,
  execTimeout: 150000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  animationDistanceThreshold: 20,
  chromeWebSecurity: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
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
      process.env.CYPRESS_PERIODIC_RUN || process.env.GH_COMMENTBODY?.toLowerCase() === '[test]'
        ? 'tests/*-private-git-*' // TODO: remove once https://issues.redhat.com/browse/RHTAPBUGS-111 is resolved
        : 'tests/{advanced-happy-path*,private-basic*,*-private-git-*}',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);

      const logOptions = {
        outputRoot: `${config.projectRoot}/cypress`,
        outputTarget: {
          'cypress-log.txt': 'txt',
        },
        printLogsToFile: 'always',
      };
      require('cypress-terminal-report/src/installLogsPrinter')(on, logOptions);

      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
        logTable(data) {
          // eslint-disable-next-line no-console
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

      const defaultValues: { [key: string]: string | boolean } = {
        KONFLUX_BASE_URL: 'https://localhost:8080',
        USERNAME: 'user2@konflux.dev',
        PASSWORD: 'password',
        GH_USERNAME: 'hac-test',
        GH_PASSWORD: '',
        GH_TOKEN: '',
        GH_SETUP_KEY: '',
        KUBECONFIG: '~/.kube/appstudio-config',
        CLEAN_NAMESPACE: 'false',
        PR_CHECK: '',
        PERIODIC_RUN: false,
        resolution: 'high',
        REMOVE_APP_ON_FAIL: false,
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
      if (config.env.PR_CHECK === true) {
        config.env.HAC_NAMESPACE = `user-ns1`;
      } else {
        config.env.HAC_NAMESPACE = `${config.env.HAC_WORKSPACE}-tenant`;
      }

      require('cypress-high-resolution')(on, config);
      return config;
    },
  },
});
