import { Octokit } from '@octokit/rest';
import dayjs from 'dayjs';

// ----- Configuration -----
const REPO_OWNER = 'konflux-ci';
const REPO_NAME = 'konflux-ui';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const TEST_MODE = process.env.TEST_MODE === 'true';

if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');
if (!TEST_MODE && !SLACK_WEBHOOK_URL) throw new Error('SLACK_WEBHOOK_URL is not set');

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ----- Helpers -----
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
  const draftPRs = [];
  const noCommentsIn2Days = [];
  const approvedButOpen = [];
  const openOver2Weeks = [];
  const openOver1Month = [];
  const openOver2Months = [];

  const now = dayjs();

  for (const pr of prs) {
    const [comments, reviews] = await Promise.all([getComments(pr.number), getReviews(pr.number)]);
    const daysOpen = now.diff(dayjs(pr.created_at), 'day');
    const prInfo = { number: pr.number };

    if (pr.draft) {
      draftPRs.push(prInfo);
      continue;
    }

    // Track latest activity
    let latestActivity = null;
    const latestReviewByUser = new Map();

    comments.forEach((c) => {
      const ts = dayjs(c.updated_at);
      if (!latestActivity || ts.isAfter(latestActivity)) latestActivity = ts;
    });

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
    if (daysOpen >= 30 && daysOpen < 60) openOver1Month.push(prInfo);
    if (daysOpen >= 60) openOver2Months.push(prInfo);
  }

  // ----- Build compact Slack message -----
  const today = now.format('MMM D, YYYY');
  let message = `:bar_chart: *Konflux-UI PR Report — ${today}*\n\n*Open PRs:* ${prs.length}\n`;

  const twoMonthsAgo = now.subtract(60, 'day').format('YYYY-MM-DD');
  const oneMonthAgo = now.subtract(30, 'day').format('YYYY-MM-DD');
  const twoWeeksAgo = now.subtract(14, 'day').format('YYYY-MM-DD');

  const prCategories = [
    {
      emoji: ':memo:',
      name: 'Stale Reviews(no comments in last 2 days)',
      prs: noCommentsIn2Days,
      filterLink: null,
    },
    {
      emoji: ':white_check_mark:',
      name: '2 Approvals/Waiting Merge',
      prs: approvedButOpen,
      filterLink: null,
    },
    {
      emoji: ':hourglass_flowing_sand:',
      name: 'Created > 2 Weeks',
      prs: openOver2Weeks,
      filterLink: `https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls?q=is:open+draft:false+created:${oneMonthAgo}..${twoWeeksAgo}`,
    },
    {
      emoji: ':alarm_clock:',
      name: 'Created > 1 Month',
      prs: openOver1Month,
      filterLink: `https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls?q=is:open+draft:false+created:${twoMonthsAgo}..${oneMonthAgo}`,
    },
    {
      emoji: ':rotating_light:',
      name: 'Created > 2 Months',
      prs: openOver2Months,
      filterLink: `https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls?q=is:open+draft:false+created:%3C${twoMonthsAgo}`,
    },
    {
      emoji: ':pencil2:',
      name: 'Drafts',
      prs: draftPRs,
      filterLink: `https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls?q=is:open+is:draft`,
    },
  ];

  prCategories.forEach((cat) => {
    if (!cat.prs.length) return;

    if (cat.filterLink) {
      message += `${cat.emoji} *${cat.name}:* <${cat.filterLink}|${cat.prs.length} PRs>\n`;
    } else {
      message += `${cat.emoji} *${cat.name}:* ${cat.prs.length} PRs (${cat.prs
        .map((p) => `<https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${p.number}|#${p.number}>`)
        .join(', ')})\n`;
    }
  });

  if (!prs.length) {
    message += `✨ All PRs are in good shape!\n`;
  } else {
    message += `\n⚡ Please accelerate reviews or merge PRs to keep the repo clean!\n`;
  }

  // ----- Send to Slack or log -----
  if (TEST_MODE) {
    console.log('--- TEST_MODE: Slack message ---');
    console.log(message);
  } else {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Slack webhook responded with ${response.status}: ${text}`);
    }
    console.log('✅ PR report sent to Slack successfully!');
  }
};

// ----- Execute -----
checkStalePRs().catch((err) => {
  console.error('❌ Error checking stale PRs:', err);
  process.exit(1);
});
