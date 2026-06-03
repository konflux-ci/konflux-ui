#!/usr/bin/env node
import { detectChromePath } from './browser-detect.js';

const path = detectChromePath();
if (path) {
  console.log(path);
} else {
  console.error('No Chrome or Chromium found on this system.');
  process.exit(1);
}
