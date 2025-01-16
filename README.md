# Konflux UI

UI for [Konflux](https://github.com/konflux-ci/konflux-ci)

### Installing

**Prerequisites:**
- Node.js version >= 20
- Yarn version 1.22

A step by step series of examples that tell you how to get a development environment running:

1. Clone the repository
2. Install dependencies
   ```
   yarn install
   ```
3. Runs the app in development mode
    ```
    yarn start
    ```
## Running with Konflux-ci

By default, the UI uses the stage cluster for API calls. However, if you want to run the UI with a local Konflux deployment, follow the steps below.

1. Follow the guide at https://github.com/konflux-ci/konflux-ci to deploy Konflux locally (use branch: `new-ui`)

2. Once you have Konflux deployed, make the following changes to your .env file:

```diff
# .env

+ AUTH_URL=https://127.0.0.1:9443/
+ REGISTRATION_URL=https://127.0.0.1:9443/
+ PROXY_URL=https://127.0.0.1:9443/
+ PROXY_WEBSOCKET_URL=wss://127.0.0.1:9443
- AUTH_URL= https://konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/
- REGISTRATION_URL=https://konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/
- PROXY_URL=https://konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/
- PROXY_WEBSOCKET_URL=wss://konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/
```
3. Update your webpack.dev.config.js file with the following changes:

```diff
@@ webpack.dev.config.js:14 @@
    historyApiFallback: true,
    hot: true,
    server: 'https',
    proxy: [
      {
+        context: (path) => path.includes('/oauth2/') || path.includes('/idp/'),
-        context: (path) => path.includes('/oauth2/'),
        target: process.env.AUTH_URL,
        secure: false,
        changeOrigin: true,
+        autoRewrite: true,
-        autoRewrite: false,
        toProxy: true,
        headers: {
          'X-Forwarded-Host': `localhost:${DEV_SERVER_PORT}`,
        },
        onProxyRes: (proxyRes) => {
          const location = proxyRes.headers['location'];
          if (location) {
            proxyRes.headers['location'] = location.replace(
+              'localhost:9443',
+              `localhost:${DEV_SERVER_PORT}`,
-              'konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com%2Foauth2',
-              `localhost:${DEV_SERVER_PORT}/oauth2`,
            );
          }
        },

```

## Available Scripts

In the project directory, you can run:

* `yarn build`: Builds the app for production using webpack with the production configuration file.
* `yarn start`: Runs the app in development mode. Opens the app in your default browser.
* `yarn test`: Runs unit tests using jest.
* `yarn coverage`: Runs the test suite with coverage report. 
* `yarn lint`: Runs both TypeScript and SASS linting.
* `yarn lint:ts`: Lints TypeScript files.
* `yarn lint:sass`: Lints SASS files.

## Built With

* [Webpack](https://webpack.js.org/) - Module bundler
* [Jest](https://jestjs.io/) - Testing framework
* [ESLint](https://eslint.org/) - TypeScript linting
* [Stylelint](https://stylelint.io/) - SASS linting
