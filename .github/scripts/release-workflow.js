const { Gitlab } = require('@gitbeaker/node');
const { WebClient } = require('@slack/web-api');

const gitlab = new Gitlab({ token: process.env.GITLAB_TOKEN });
const slack = new WebClient(process.env.SLACK_WEBHOOK_URL);

const DEPLOY_REPO_ID = 'your-deploy-repo-id';
const SOURCE_BRANCH = 'main';
const TARGET_BRANCH = process.argv[2] || 'staging';

async function run() {
  // 1. 检查是否已有 open MR
  const openMrs = await gitlab.MergeRequests.all({
    projectId: DEPLOY_REPO_ID,
    state: 'opened',
    targetBranch: TARGET_BRANCH,
  });

  if (openMrs.length > 0) {
    console.log(`MR to ${TARGET_BRANCH} already exists. Skip.`);
    return;
  }

  // 2. 获取 main 分支的 commits（自上次 deploy 以来）
  const commits = await gitlab.Commits.all(DEPLOY_REPO_ID, { refName: SOURCE_BRANCH });
  if (commits.length === 0) {
    console.log(`No new commits to deploy for ${TARGET_BRANCH}. Skip.`);
    return;
  }

  // 3. 根据 commit message 生成 changelog (issue 分组)
  const changelog = generateChangelog(commits);

  // 4. 创建 MR
  const mr = await gitlab.MergeRequests.create(
    DEPLOY_REPO_ID,
    SOURCE_BRANCH,
    TARGET_BRANCH,
    `Release: ${new Date().toISOString().slice(0, 10)}`,
    changelog,
  );

  console.log(`Created MR: ${mr.web_url}`);

  // 5. 发送 Slack 通知
  await slack.chat.postMessage({
    channel: '#release-updates',
    text: `🟢 Staging MR created: <${mr.web_url}|${mr.title}> \nWaiting for approval.`,
  });
}

function generateChangelog(commits) {
  const issueGroups = {};
  commits.forEach((c) => {
    const match = c.title.match(/#(\d+)/);
    if (match) {
      const issueId = match[1];
      if (!issueGroups[issueId]) {
        issueGroups[issueId] = [];
      }
      issueGroups[issueId].push(`- ${c.title}`);
    }
  });

  if (Object.keys(issueGroups).length === 0) {
    return 'No issues linked.';
  }

  let changelog = '## Changes\n';
  for (const [issue, msgs] of Object.entries(issueGroups)) {
    changelog += `\n### Issue #${issue}\n${msgs.join('\n')}\n`;
  }
  return changelog;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
