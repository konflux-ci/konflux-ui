---
name: Bug Report
about: Report a problem in Konflux UI
title: '[BUG] '
labels: bug
assignees: ''
---

Thanks for helping improve [Konflux UI](https://github.com/konflux-ci/konflux-ui) — the web UI for [Konflux](https://github.com/konflux-ci/konflux-ci) on OpenShift/Kubernetes.

## Summary

**Describe the bug**
A clear description of what went wrong and the impact (blocked workflow, wrong data, crash, etc.).

**Jira ticket (if any)**
<!-- e.g. KFLUXUI-1234 or link to issues.redhat.com -->

## Where in the UI

**Area / page**
<!-- e.g. Applications list, Application details → Overview, Pipeline run logs, Releases, Integration tests, Import flow -->

**URL path (if applicable)**
<!-- e.g. /ns/my-tenant/applications/my-app -->

**Namespace / tenant**
<!-- OpenShift namespace or Konflux tenant you were using -->

## Steps to reproduce

1.
2.
3.

**Expected behavior**


**Actual behavior**


## Environment

**How you run the UI**
- [ ] Hosted Konflux (OpenShift — stage/prod)
- [ ] Local dev (`yarn start` / `./setup.sh`)
- [ ] Other:

**Backend / cluster** (for API or auth issues)
<!-- e.g. default stage cluster, local Konflux (127.0.0.1:9443), custom PROXY_URL in .env -->

**Browser**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- Version:

**konflux-ui version**
<!-- Git commit, image tag, or `package.json` version if known -->

**Node.js / Yarn** (local dev only)
<!-- e.g. Node 20.x, Yarn 4.x via Corepack -->

## Diagnostics

**Console errors**
<!-- Browser DevTools → Console. Paste relevant errors or stack traces. -->

**Failed network requests**
<!-- DevTools → Network: failing URL, status code, endpoint (e.g. Kubernetes watch, proxy). Redact tokens. -->

**Screenshots / screen recording**
<!-- Especially for layout, empty states, or wrong status icons. -->

## Additional context

**Feature flags**
<!-- If you use client-side feature flags, note which are enabled. -->

**Related resources**
<!-- Application, Component, PipelineRun, Release, etc. names — no secrets. -->

**Possible regression**
<!-- Did this work before? Last known good version or date. -->
