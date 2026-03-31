/**
 * Core log language definition for Prism (without SCSS imports)
 * This is safe to use in Web Workers
 *
 * Based on refractor's log language definition
 * https://github.com/wooorm/refractor/blob/main/lang/log.js
 */

import type Prism from 'prismjs';

export default function registerLogSyntaxCore(PrismInstance: typeof Prism) {
  // Skip if already registered
  if (PrismInstance.languages.log) {
    return;
  }

  const datePattern =
    /\b\d{4}[-/:]\d{2}[-/:]\d{2}(?:T(?=\d{1,2}:)|(?=\s\d{1,2}:))?|\b\d{1,4}[-/ ](?:\d{1,2}|Apr|Aug|Dec|Feb|Jan|Jul|Jun|Mar|May|Nov|Oct|Sep)[-/ ]\d{2,4}T?\b|\b(?:Fri|Mon|Sat|Sun|Thu|Tue|Wed|Apr|Aug|Dec|Feb|Jan|Jul|Jun|Mar|May|Nov|Oct|Sep)\s{1,2}\d{1,2}\b/i;

  PrismInstance.languages.log = {
    /* ================= URL ================= */
    url: {
      pattern: /\b(?:https?|ftp|file):\/\/[^\s"'<>\]]+/,
      greedy: true,
    },

    /* ================= MIME Type ================= */
    'mime-type': {
      pattern: /\b[a-z]+\/[a-z0-9][\w.+-]*(?:;\s*[a-z][\w-]*=[^\s;]+)*/i,
      greedy: true,
    },

    /* ================= Container Images ================= */
    'container-image': {
      pattern:
        /\b(?:docker|oci):\/\/(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?\/(?:[\w.-]+\/)*[\w.-]+(?::[\w.-]+)?(?:@sha256:[a-f0-9]{64})?(?=\s|$|[^\w/-])|\b(?:docker|oci):\/\/localhost:\d+\/(?:[\w.-]+\/)*[\w.-]+(?::[\w.-]+)?(?:@sha256:[a-f0-9]{64})?(?=\s|$|[^\w/-])|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?\/(?:[\w.-]+\/)*[\w.-]+(?::[\w.-]+)?(?:@sha256:[a-f0-9]{64})?(?=\s|$|[^\w/-])/i,
      greedy: true,
      alias: 'constant',
    },

    /* ================= Webpack Loader Chain ================= */
    'loader-chain': {
      pattern: /(?:\.\/|\/)?[\w@.-]+(?:\/[\w@.-]+)+(?:!(?:\.\/|\/)?[\w@.-]+(?:\/[\w@.-]+)+)+/,
      greedy: true,
      alias: 'file-path',
    },

    /* ================= Filenames ================= */
    filename: {
      pattern:
        /\b[a-zA-Z0-9_][\w.-]*\.(?:sh|bash|py|js|ts|tsx|jsx|json|yaml|yml|xml|txt|log|md|go|rs|java|c|cpp|h|hpp|conf|cfg|ini|toml|env|dockerfile|lock|ico|sarif|sql|rb|php|css|scss|html|svg|vue|svelte)(?![\w.-])/i,
      greedy: true,
    },

    /* ================= CLI Arguments ================= */
    'cli-arg': {
      pattern: /--?[a-zA-Z][\w-]*(?:=[^\s]+)?/,
      greedy: true,
      inside: {
        key: {
          pattern: /^--?[a-zA-Z][\w-]*(?==)/,
          alias: 'attr-name',
        },
        operator: /=/,
      },
    },

    /* ================= Key=Value ================= */
    'key-value': {
      pattern:
        /(^|[\s,({[])(?:"([a-zA-Z_][\w.-]*)"|'([a-zA-Z_][\w.-]*)'|([a-zA-Z_][\w.-]*))([:+-]?=)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,)}\]]+)/,
      greedy: true,
      lookbehind: true,
      inside: {
        key: {
          pattern: /^(?:"[a-zA-Z_][\w.-]*"|'[a-zA-Z_][\w.-]*'|[a-zA-Z_][\w.-]*)(?=[:+-]?=)/,
          alias: 'attr-name',
        },
        operator: /[:+-]?=/,
      },
    },

    /* ================= Strings ================= */
    string: {
      pattern: /"(?:\\.|[^"\\\r\n])*"|'(?![st] | \w)(?:\\.|[^'\\\r\n])*'/,
      greedy: true,
    },

    /* ================= Stacktrace ================= */
    exception: {
      pattern:
        /(^|[^\w.])[a-z][\w.]*(?:Error|Exception):.*(?:(?:\r\n?|\n)[ \t]*(?:at[ \t].+|\.{3}.*|Caused by:.*))+(?:(?:\r\n?|\n)[ \t]*\.\.\. .*)?/,
      lookbehind: true,
      greedy: true,
      alias: ['javastacktrace', 'language-javastacktrace'],
      inside: PrismInstance.languages.javastacktrace || {
        keyword: /\bat\b/,
        function: /[a-z_][\w$]*(?=\()/,
        punctuation: /[.:()]/,
      },
    },

    /* ================= Log Levels ================= */
    'log-level-error': {
      pattern:
        /\b(?:ALERT|CRIT|CRITICAL|EMERG|EMERGENCY|ERR|ERROR|FAIL|FAILED|FAILURE|FATAL|SEVERE)\b/i,
      alias: 'error',
    },

    'log-level-warn': {
      pattern: /\b(?:WARN(?:ING)?|WRN)\b/i,
      alias: 'warning',
    },

    'log-level-info': {
      pattern: /\b(?:DISPLAY|INF|INFO|NOTICE|STATUS)\b/i,
      alias: 'info',
    },

    'log-level-debug': {
      pattern: /\b(?:DBG|DEBUG|FINE|FINER|FINEST|TRACE|TRC|VERBOSE|VRB)\b/i,
      alias: 'comment',
    },

    /* ================= Result Keywords ================= */
    result: {
      pattern: /\b(?:PASSED|SUCCESS(?:FUL)?)\b/i,
      alias: 'success',
    },

    /* ================= Separators ================= */
    separator: {
      pattern: /(^|[^-+])-{3,}|={3,}|\*{3,}|- - /m,
      lookbehind: true,
      alias: 'comment',
    },

    /* ================= Email ================= */
    email: {
      pattern: /(^|\s)[-\w+.]+@[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+(?=\s)/,
      lookbehind: true,
      alias: 'url',
    },

    /* ================= IP ================= */
    'ip-address': {
      pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/,
      alias: 'constant',
    },

    /* ================= MAC ================= */
    'mac-address': {
      pattern: /\b[a-f0-9]{2}(?::[a-f0-9]{2}){5}\b/i,
      alias: 'constant',
    },

    /* ================= Domain ================= */
    domain: {
      pattern: /(^|\s)[a-z][a-z0-9-]{2,}(?:\.[a-z][a-z0-9-]*)*\.[a-z]{2,}(?=\s)/,
      lookbehind: true,
      alias: 'constant',
    },

    /* ================= UUID ================= */
    uuid: {
      pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
      greedy: true,
      alias: 'constant',
    },

    /* ================= Hash ================= */
    hash: {
      pattern:
        /\b(?:(?=[a-f0-9]*[a-f])[a-f0-9]{32}|(?=[a-f0-9]*[a-f])[a-f0-9]{40}|(?=[a-f0-9]*[a-f])[a-f0-9]{64}|(?=[a-f0-9]*[a-f])[a-f0-9]{128}|(?=[a-f0-9]*[a-f])[a-f0-9]{7,16})\b/i,
    },

    /* ================= File Path ================= */
    'file-path': {
      pattern:
        /(^|[\s=:])(?![a-z0-9.-]+\.[a-z]{2,}\/)(\s*[a-z]:[\\/][\w/.-]+|\s*\/[\w/.-]+|\s*\.\.?\/[\w/.-]+|\s*[a-z][\w-]+(?:\/[\w.-]+)+)/i,
      lookbehind: true,
      greedy: true,
    },

    /* ================= Kubernetes Resources (fallback) ================= */
    'k8s-resource': {
      pattern: /\b[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*\/[a-z0-9][\w.-]*\b/i,
      greedy: true,
      alias: 'file-path',
    },

    /* ================= Date / Time ================= */
    date: {
      pattern: datePattern,
      alias: 'number',
    },

    time: {
      pattern:
        /\b\d{1,2}:\d{1,2}:\d{1,2}(?:[.,:]\d+)?(?:\s?[+-]\d{2}:?\d{2}|Z)?\b|\b\d+(?:\.\d+)?\s?(?:sec|ms|[smh])\b/i,
      alias: 'number',
    },

    /* ================= Boolean ================= */
    boolean: /\b(?:false|null|true)\b/i,

    /* ================= Process / PID ================= */
    pid: {
      pattern: /(?:\bpid=|\[)\d{2,10}\]?/i,
      alias: 'number',
    },

    /* ================= Number ================= */
    number: {
      pattern:
        /(^|[^.\w])(?:0x[a-f0-9]+|0o[0-7]+|0b[01]+|v?\d[\da-f]*(?:\.\d+)*(?:e[+-]?\d+)?[a-z]{0,3}\b)/i,
      lookbehind: true,
    },

    /* ================= Operator ================= */
    operator: /[;:?<=>~/@!$%&+\-|^(){}*#]/,

    punctuation: /[[\].,]/,
  };
}
