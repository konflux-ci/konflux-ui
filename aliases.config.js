import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import stripJsonComments from 'strip-json-comments';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getTsConfigBaseURLAndPath = () => {
  const tsconfigPath = path.resolve(__dirname, 'tsconfig.json');
  const tsconfig = JSON.parse(stripJsonComments(fs.readFileSync(tsconfigPath, 'utf-8')));

  const baseUrl = tsconfig.compilerOptions.baseUrl || '.';
  const pathsMapping = tsconfig.compilerOptions.paths || {};

  return { baseUrl, pathsMapping };
};

export const getWebpackAliases = () => {
  const { baseUrl, pathsMapping } = getTsConfigBaseURLAndPath();
  const aliases = {};

  // Iterate over each alias defined in tsconfig paths.
  for (const [aliasKey, targetPaths] of Object.entries(pathsMapping)) {
    // Remove trailing '/*' from the alias key.
    const formattedKey = aliasKey.replace(/\/\*$/, '');
    // Use the first target path and remove its trailing '/*' if present.
    const targetPath = targetPaths[0].replace(/\/\*$/, '');
    // Resolve the absolute path using the baseUrl from tsconfig.
    aliases[formattedKey] = path.resolve(__dirname, baseUrl, targetPath);
  }

  return aliases;
};

export const getJestAliases = () => {
  const { baseUrl, pathsMapping } = getTsConfigBaseURLAndPath();
  const moduleNameMapper = {};

  // Iterate over each alias defined in tsconfig paths.
  for (const [aliasKey, targetPaths] of Object.entries(pathsMapping)) {
    // Create a regex pattern from the alias (e.g. "@routes/*" becomes "^@routes/(.*)$")
    const formattedKey = `^${aliasKey.replace(/\/\*$/, '')}/(.*)$`;
    // Get the first target path, remove trailing '/*' and build the mapped value.
    const targetPath = targetPaths[0].replace(/\/\*$/, '');
    // Jest requires the path to be prefixed with "<rootDir>/".
    const mappedValue = `<rootDir>/${path.join(baseUrl, targetPath)}/$1`;
    moduleNameMapper[formattedKey] = mappedValue;
  }

  return moduleNameMapper;
};
