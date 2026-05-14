import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Redirect specific source modules to pre-built mock files so that
 * components render with controlled data instead of making real API calls.
 *
 * Works on resolved absolute paths, so it intercepts regardless of whether
 * the import uses a relative path, a `~/` alias, or a barrel re-export.
 */
function screenshotMocks(): Plugin {
  const mockMap: Record<string, string> = {
    [path.resolve(projectRoot, 'src/k8s/hooks/useK8sWatchResource.ts')]: path.resolve(
      __dirname,
      'mocks/k8s.ts',
    ),
    [path.resolve(projectRoot, 'src/utils/rbac.ts')]: path.resolve(__dirname, 'mocks/rbac.ts'),
  };

  return {
    name: 'screenshot-mocks',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer) {
        return null;
      }

      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved) {
        return null;
      }

      const cleanId = resolved.id.split('?')[0].split('#')[0];
      return mockMap[cleanId] ?? null;
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
    }),
    screenshotMocks(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(projectRoot, 'src'),
      '@routes': path.resolve(projectRoot, 'src/routes'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import'],
        importers: [
          {
            findFileUrl(url: string) {
              if (!url.startsWith('~')) {
                return null;
              }
              return pathToFileURL(path.resolve(projectRoot, 'node_modules', url.substring(1)));
            },
          },
        ],
      },
    },
  },
  server: {
    port: 0,
  },
});
