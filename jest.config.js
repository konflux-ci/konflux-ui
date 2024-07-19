import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync(`${__dirname}/.swcrc`, 'utf-8'));

export default {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { ...config }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/config/jest.mock.js',
    'lodash-es': 'lodash',
  },
  roots: ['<rootDir>/src/'],
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/stories/*'],
  coverageDirectory: './coverage/',
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
};
