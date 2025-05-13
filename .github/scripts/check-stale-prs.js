const { Octokit } = require('@octokit/rest');
const dayjs = require('dayjs');

const REPO_OWNER = 'your-org';
const REPO_NAME = 'your-repo';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const getPRs = async () => {
  const { data } = await octokit.pulls.list({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100,
  });
  return data;
};

const getComments = async (prNumber) => {
  const { data } = await octokit.issues.listComments({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: prNumber,
    per_page: 100,
  });
  return data;
};

const getReviews = async (prNumber) => {
  const { data } = await octokit.pulls.listReviews({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });
  return data;
};

const isDormant = (lastActivityDate) => {
  return dayjs().diff(dayjs(lastActivityDate), 'day') >= 7;
};

const checkStalePRs = async () => {
  const prs = await getPRs();
  const stalePRs = [];

  for (const pr of prs) {
    const comments = await getComments(pr.number);
    const reviews = await getReviews(pr.number);

    const approvals = reviews.filter((r) => r.state === 'APPROVED');
    const latestComment = comments.length > 0 ? comments[comments.length - 1].updated_at : null;
    const lastActivityDate = latestComment || pr.updated_at;

    let reason = '';

    if (approvals.length >= 2 && !pr.merged_at) {
      reason = 'approved-but-not-merged-over-24h';
    } else if (dayjs().diff(dayjs(pr.created_at), 'hour') >= 24 && comments.length === 0) {
      reason = 'no-comments-over-24h';
    } else if (comments.length > 0 && dayjs().diff(dayjs(latestComment), 'hour') >= 24) {
      reason = 'no-activity-since-last-comment-24h';
    } else if (dayjs().diff(dayjs(pr.created_at), 'day') >= 14) {
      reason = 'older-than-2-weeks';
    }

    if (isDormant(lastActivityDate)) {
      reason = 'dormant-pr';
    }

    if (reason) {
      stalePRs.push({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        reason,
      });
    }
  }

  const grouped = stalePRs.reduce((acc, pr) => {
    if (!acc[pr.reason]) {
      acc[pr.reason] = [];
    }
    acc[pr.reason].push(pr);
    return acc;
  }, {});

  const attachments = [];

  for (const [reason, prs] of Object.entries(grouped)) {
    attachments.push({
      color: '#ffcc00',
      pretext: `*Reason: ${reason}*`,
      fields: prs.map((pr) => ({
        title: `#${pr.number} - ${pr.title}`,
        value: `<${pr.url}|View PR>`,
        short: false,
      })),
    });
  }

  const message = {
    text: `🔔 *PR Attention Report*`,
    attachments,
  };

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
};

checkStalePRs().catch((err) => {
  console.error(err);
  process.exit(1);
});
