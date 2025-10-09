import { Octokit } from '@octokit/rest';
import dayjs from 'dayjs';

// ----- Configuration -----
const REPO_OWNER = 'konflux-ci';
const REPO_NAME = 'konflux-ui';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');
if (!SLACK_WEBHOOK_URL) throw new Error('SLACK_WEBHOOK_URL is not set');

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ----- GitHub API helpers -----
const getPRs = (params = {}) =>
  octokit.paginate(octokit.pulls.list, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100,
    ...params,
  });

const getComments = (prNumber) =>
  octokit.paginate(octokit.issues.listComments, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: prNumber,
    per_page: 100,
  });

const getReviews = (prNumber) =>
  octokit.paginate(octokit.pulls.listReviews, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });

// ----- Main logic -----
const checkStalePRs = async () => {
  const prs = await getPRs();

  const noCommentsIn2Days = [];
  const approvedButOpen = [];
  const openOver2Weeks = [];
  const openOver1Month = [];

  const now = dayjs();

  for (const pr of prs) {
    const [comments, reviews] = await Promise.all([getComments(pr.number), getReviews(pr.number)]);
    const daysOpen = now.diff(dayjs(pr.created_at), 'day');

    const prInfo = {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: pr.user.login,
      daysOpen,
    };

    // Track latest activity
    let latestActivity = null;
    const latestReviewByUser = new Map();

    // Comments
    comments.forEach((c) => {
      const ts = dayjs(c.updated_at);
      if (!latestActivity || ts.isAfter(latestActivity)) latestActivity = ts;
    });

    // Reviews
    reviews.forEach((r) => {
      if (!r.submitted_at) return;
      const ts = dayjs(r.submitted_at);
      if (!latestActivity || ts.isAfter(latestActivity)) latestActivity = ts;

      const login = r.user?.login;
      if (!login) return;

      const prior = latestReviewByUser.get(login);
      if (!prior || ts.isAfter(prior.submitted_at)) {
        latestReviewByUser.set(login, { state: r.state, submitted_at: ts });
      }
    });

    const activeApprovals = Array.from(latestReviewByUser.values()).filter(
      (rev) => rev.state === 'APPROVED',
    );

    if (activeApprovals.length >= 2 && !pr.merged_at) approvedButOpen.push(prInfo);

    const inactiveForTwoDays = latestActivity
      ? now.diff(latestActivity, 'day') >= 2
      : daysOpen >= 2;

    if (inactiveForTwoDays) noCommentsIn2Days.push(prInfo);
    if (daysOpen >= 14 && daysOpen < 30) openOver2Weeks.push(prInfo);
    if (daysOpen >= 30) openOver1Month.push(prInfo);
  }

  // ----- Build Slack message -----
  const today = now.format('dddd, MMM D, YYYY');
  let message = `📊 *Konflux-UI PR Report — ${today}*\n\n*Total Open PRs:* ${prs.length}\n\n`;

  const formatPRList = (prArray) =>
    prArray
      .map(
        (pr) =>
          `• <${pr.url}|#${pr.number} ${pr.title}> (opened by @${pr.author}${pr.daysOpen ? `, ${pr.daysOpen} days ago` : ''})`,
      )
      .join('\n');

  if (noCommentsIn2Days.length) {
    message += `📝 *PRs Under Review (no comments in last 2 days)*\n${formatPRList(noCommentsIn2Days)}\n\n`;
  }

  if (approvedButOpen.length) {
    message += `✅ *PRs with 2 Approvals but Still Open*\n${formatPRList(approvedButOpen)}\n\n`;
  }

  if (openOver2Weeks.length) {
    message += `⏳ *PRs Open > 2 Weeks*\n${formatPRList(openOver2Weeks)}\n\n`;
  }

  if (openOver1Month.length) {
    message += `⏰ *PRs Open > 1 Month*\n${formatPRList(openOver1Month)}\n\n`;
  }

  if (
    noCommentsIn2Days.length === 0 &&
    approvedButOpen.length === 0 &&
    openOver2Weeks.length === 0 &&
    openOver1Month.length === 0
  ) {
    message += `✨ All PRs are in good shape! No stale PRs found.\n`;
  }

  // ----- Send to Slack -----
  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook responded with ${response.status}: ${text}`);
  }

  console.log('✅ PR report sent to Slack successfully!');
};

// ----- Execute -----
checkStalePRs().catch((err) => {
  console.error('❌ Error checking stale PRs:', err);
  process.exit(1);
});
