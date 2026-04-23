# Jira Conventions — konflux-ui

## Instance
- URL: https://redhat.atlassian.net
- Type: Cloud

## Project
- Key: KFLUXUI

## Issue Types
- Bug
- Task

## Required Fields (all types)
- Summary (title)
- Description

## Title Format
`[<Area>] <imperative summary>`

### Examples
- `[LogViewer] Add syntax highlighting for JSON log lines`
- `[Pipeline] Fix build status not updating after re-run`

## Components
Not yet configured — skip in interview.

## Labels
Not yet configured — skip in interview.

## Priority Defaults
- Bug: infer from severity (Critical→Blocker, Major→Major, default→Normal, cosmetic→Minor)
- Task: default Normal unless user specifies otherwise

## Epic Linking
Not required.

## Task Template
Title + description with bullet points summarizing the work.

## Bug Template
```
Description of problem:

How reproducible:

Steps to Reproduce:

1.
2.
3.

Actual results:

Expected results:

Is this a customer issue: Yes | No

Please attach any logs/print screens to the ticket or share any additional info/links:
```

## PR Linking
If a PR exists for the change, add the PR URL as a comment on the ticket after creation.
