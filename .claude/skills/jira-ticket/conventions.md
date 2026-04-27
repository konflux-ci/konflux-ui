# Jira Conventions — konflux-ui

## Instance
- URL: https://redhat.atlassian.net
- Type: Cloud

## Project
- Key: KFLUXUI

## Issue Types
- Bug
- Task
- Story

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
- Story: default Normal unless user specifies otherwise

## Epic / Parent Linking
Optional. When the user provides a parent ticket ID (e.g., an epic key like `KFLUXUI-1234`), the new issue should be created as a child of that parent.

**Jira Cloud field:** Use `"parent": "<PARENT_KEY>"` in `additional_fields`. Do NOT use the legacy `customfield_10014` epic link field.

## Task Template
Title + description with bullet points summarizing the work.

## Story Template
```
## Acceptance Criteria

- [ ] As a <user>, I can <action> so that <outcome>
- [ ] ...

## Notes

<Developer notes, links to design docs, references to related documentation, or any additional context>
```

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
