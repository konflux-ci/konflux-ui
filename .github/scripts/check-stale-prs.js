const { Octokit } = require('@octokit/rest');
const dayjs = require('dayjs');

const REPO_OWNER = 'konflux-ci';
const REPO_NAME = 'konflux-ui';
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

const checkStalePRs = async () => {
  const prs = await getPRs();

  const noCommentsIn2Days = [];
  const approvedButOpen = [];
  const openOver2Weeks = [];
  const openOver1Month = [];

  for (const pr of prs) {
    const comments = await getComments(pr.number);
    const reviews = await getReviews(pr.number);

    const approvals = reviews.filter((r) => r.state === 'APPROVED');
    const latestComment = comments.length > 0 ? comments[comments.length - 1].updated_at : null;
    const daysOpen = dayjs().diff(dayjs(pr.created_at), 'day');

    const prInfo = {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: pr.user.login,
      daysOpen,
    };

    // PRs with 2+ approvals but still open
    if (approvals.length >= 2 && !pr.merged_at) {
      approvedButOpen.push(prInfo);
    }

    // PRs under review with no comments OR no new comments within 2 days
    if (comments.length === 0 && dayjs().diff(dayjs(pr.created_at), 'day') >= 2) {
      noCommentsIn2Days.push(prInfo);
    } else if (comments.length > 0 && dayjs().diff(dayjs(latestComment), 'day') >= 2) {
      noCommentsIn2Days.push(prInfo);
    }

    // PRs open for more than 2 weeks (14 days)
    if (daysOpen >= 14 && daysOpen < 30) {
      openOver2Weeks.push(prInfo);
    }

    // PRs open for more than 1 month (30 days)
    if (daysOpen >= 30) {
      openOver1Month.push(prInfo);
    }
  }

  // Build Slack message
  const today = dayjs().format('dddd, MMM D, YYYY');
  let message = `📊 *Konflux-UI PR Report — ${today}*\n\n`;
  message += `*Total Open PRs:* ${prs.length}\n\n`;

  // PRs Under Review (no comments in last 2 days)
  if (noCommentsIn2Days.length > 0) {
    message += `📝 *PRs Under Review (no comments in last 2 days)*\n`;
    noCommentsIn2Days.forEach((pr) => {
      message += `• <${pr.url}|#${pr.number} ${pr.title}> (opened by @${pr.author})\n`;
    });
    message += `\n`;
  }

  // PRs with 2 Approvals but Still Open
  if (approvedButOpen.length > 0) {
    message += `✅ *PRs with 2 Approvals but Still Open*\n`;
    approvedButOpen.forEach((pr) => {
      message += `• <${pr.url}|#${pr.number} ${pr.title}> (opened by @${pr.author})\n`;
    });
    message += `\n`;
  }

  // PRs Open > 2 Weeks
  if (openOver2Weeks.length > 0) {
    message += `⏳ *PRs Open > 2 Weeks*\n`;
    openOver2Weeks.forEach((pr) => {
      message += `• <${pr.url}|#${pr.number} ${pr.title}> (opened by @${pr.author}, opened ${pr.daysOpen} days ago)\n`;
    });
    message += `\n`;
  }

  // PRs Open > 1 Month
  if (openOver1Month.length > 0) {
    message += `⏰ *PRs Open > 1 Month*\n`;
    openOver1Month.forEach((pr) => {
      message += `• <${pr.url}|#${pr.number} ${pr.title}> (opened by @${pr.author}, opened ${pr.daysOpen} days ago)\n`;
    });
    message += `\n`;
  }

  // If no stale PRs, send a positive message
  if (
    noCommentsIn2Days.length === 0 &&
    approvedButOpen.length === 0 &&
    openOver2Weeks.length === 0 &&
    openOver1Month.length === 0
  ) {
    message += `✨ All PRs are in good shape! No stale PRs found.\n`;
  }

  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });

  console.log('PR report sent to Slack successfully!');
};

checkStalePRs().catch((err) => {
  console.error('Error checking stale PRs:', err);
  process.exit(1);
});
