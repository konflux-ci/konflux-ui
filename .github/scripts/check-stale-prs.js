/**
 * Stale PR Report Script
 *
 * This script analyzes open pull requests in the konflux-ui repository and generates
 * a comprehensive Slack report to help teams track PR health and identify bottlenecks.
 *
 * CATEGORIZATION LOGIC:
 *
 * 1. **Needs Author Followup (Stale PRs)**:
 *    - Reviewer provided feedback more than 2 business days ago
 *    - Author has not responded with commits or comments since then
 *    - Indicates author action is blocking PR progress
 *
 * 2. **Needs Review**:
 *    - Author last acted (via commit or comment) more than 2 business days ago
 *    - No reviewer activity since, or author activity is more recent than reviewer
 *    - Indicates reviewer action is needed
 *
 * 3. **Waiting Merge (Approved)**:
 *    - PR has 2 or more approvals
 *    - Not yet merged
 *    - Ready for final merge action
 *
 * 4. **Age-based Categories**:
 *    - Created > 2 Weeks: 14-29 days old
 *    - Created > 1 Month: 30-59 days old
 *    - Created > 2 Months: 60+ days old
 *
 * 5. **Drafts**: Work-in-progress PRs marked as draft
 *
 * BUSINESS DAY CALCULATION:
 * - Only weekdays (Monday-Friday) are counted
 * - Weekends are excluded from staleness calculations
 * - Uses mathematical approach for performance
 *
 * BOT FILTERING:
 * - Bot activity (codecov, dependabot, github-actions, etc.) is excluded
 * - Only human activity affects staleness determination
 *
 * OUTPUT MODES:
 * - Production: Sends formatted report to Slack webhook
 * - TEST_MODE: Logs report to console for validation
 *
 * ENVIRONMENT VARIABLES:
 * - GITHUB_TOKEN: Required - GitHub API authentication token
 * - SLACK_WEBHOOK_URL: Required (unless TEST_MODE) - cwf-cue Slack incoming webhook URL
 * - TEST_MODE: Optional - Set to 'true' to log output instead of sending to Slack
 */

import { Octokit } from '@octokit/rest';
import dayjs from 'dayjs';
// Note: Use .js extension for Node ESM compatibility
import isBetween from 'dayjs/plugin/isBetween.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

// Extend dayjs with necessary plugins
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// ----- Configuration -----

/** Repository configuration */
const REPO_OWNER = 'konflux-ci';
const REPO_NAME = 'konflux-ui';

/** Environment variables */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // Slack webhook for cwf-cue notifications
const TEST_MODE = process.env.TEST_MODE === 'true';

/** Validate required environment variables */
if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');
if (!TEST_MODE && !SLACK_WEBHOOK_URL) throw new Error('SLACK_WEBHOOK_URL is not set');

/** Initialize GitHub API client */
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ----- Utility Functions -----

/**
 * Calculates business days (weekdays) between two dates, excluding weekends.
 * Uses a mathematical approach for better performance than iterating day-by-day.
 *
 * Algorithm:
 * 1. Normalize dates to start of day for consistent comparison
 * 2. Calculate full weeks and multiply by 5 weekdays per week
 * 3. Count remaining weekdays in the partial week
 *
 * @param {import('dayjs').Dayjs} startDate - Earlier date (inclusive)
 * @param {import('dayjs').Dayjs} endDate - Later date (exclusive of the end date itself)
 * @returns {number} Number of business days between dates
 *
 * @example
 * // Friday to Monday (2 days apart, but 0 business days)
 * getBusinessDaysDiff(dayjs('2024-01-05'), dayjs('2024-01-08')) // Returns 0
 *
 * @example
 * // Monday to Friday (4 business days)
 * getBusinessDaysDiff(dayjs('2024-01-08'), dayjs('2024-01-12')) // Returns 4
 */
const getBusinessDaysDiff = (startDate, endDate) => {
  // Ensure the dates are on the same day for consistent comparison,
  // but only count full days that have passed.
  const start = startDate.startOf('day');
  const end = endDate.startOf('day');

  // If start is after or same as end, no full business days have passed
  if (start.isSame(end) || start.isAfter(end)) {
    return 0;
  }

  // Calculate total number of days between the two dates (inclusive of start, exclusive of end)
  const totalDays = end.diff(start, 'day');

  // Total number of full weeks
  const fullWeeks = Math.floor(totalDays / 7);

  // Business days from full weeks
  let businessDays = fullWeeks * 5;

  // Remaining days (less than a week)
  let remainingDays = totalDays % 7;
  let currentDay = start.day(); // Start day of the week (0=Sunday, 6=Saturday)

  // Iterate over remaining days
  while (remainingDays > 0) {
    // Check if the current day is a weekday (Monday=1 to Friday=5)
    if (currentDay !== 0 && currentDay !== 6) {
      businessDays++;
    }
    // Move to the next day of the week
    currentDay = (currentDay + 1) % 7;
    remainingDays--;
  }

  return businessDays;
};

// ----- GitHub API Helpers -----

/**
 * Fetches all open pull requests for the repository.
 * Uses pagination to retrieve all PRs (not just the first page).
 *
 * @param {object} params - Additional query parameters to pass to the GitHub API
 * @returns {Promise<Array>} Array of PR objects with full GitHub API PR data
 */
const getPRs = (params = {}) =>
  octokit.paginate(octokit.pulls.list, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100,
    ...params,
  });

/**
 * Fetches all issue comments (general PR comments) for a PR.
 * Note: This does NOT include inline code review comments (see getReviewComments).
 *
 * @param {number} prNumber - PR number
 * @returns {Promise<Array>} Array of comment objects with user, created_at, and body
 */
const getGeneralComments = (prNumber) =>
  octokit.paginate(octokit.issues.listComments, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: prNumber,
    per_page: 100,
  });

/**
 * Fetches all review objects (approve, request changes, comment) for a PR.
 * Reviews represent formal review actions submitted by reviewers.
 *
 * @param {number} prNumber - PR number
 * @returns {Promise<Array>} Array of review objects with state (APPROVED, CHANGES_REQUESTED,
 *                           COMMENTED, DISMISSED), user, and submitted_at timestamp
 */
const getReviewsActions = (prNumber) =>
  octokit.paginate(octokit.pulls.listReviews, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });

/**
 * Fetches all inline code review comments for a PR.
 * These are comments attached to specific lines of code in the diff.
 * Distinct from general PR comments (see getComments).
 *
 * @param {number} prNumber - PR number
 * @returns {Promise<Array>} Array of inline review comment objects with user, created_at,
 *                           path, position, and body
 */
const getReviewInlineComments = (prNumber) =>
  octokit.paginate(octokit.pulls.listReviewComments, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });

/**
 * Fetches all commits for a PR to track author activity.
 * Commits are considered implicit author activity (pushing new code).
 *
 * @param {number} prNumber - PR number
 * @returns {Promise<Array>} Array of commit objects with author info and commit.author.date
 */
const getCommits = (prNumber) =>
  octokit.paginate(octokit.pulls.listCommits, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });

// ----- Main Logic -----

/**
 * Main function that orchestrates the entire PR analysis and reporting process.
 *
 * Process:
 * 1. Fetch all open PRs from GitHub
 * 2. For each PR, fetch all related activity (comments, reviews, commits)
 * 3. Determine last activity timestamp for author vs reviewers
 * 4. Categorize PR based on activity patterns and approval status
 * 5. Generate formatted Slack message with all categories
 * 6. Send to Slack (or log if in TEST_MODE)
 *
 * @throws {Error} If GitHub API calls fail or Slack webhook rejects the message
 */
const checkStalePRs = async () => {
  try {
    const prs = await getPRs();

    // Initialize categorization arrays
    const draftPRs = []; // PRs marked as draft
    const stalePRs = []; // PRs waiting for author followup (>2 business days)
    const needsReview = []; // PRs waiting for reviewer action (>2 business days)
    const approvedButOpen = []; // PRs with 2+ approvals but not merged
    const openOver2Weeks = []; // PRs open 14-29 days
    const openOver1Month = []; // PRs open 30-59 days
    const openOver2Months = []; // PRs open 60+ days

    const now = dayjs();

    /**
     * Helper to check if a user is a bot (should be excluded from activity tracking).
     * Bot activity should not affect staleness calculations as it doesn't represent
     * human review or author response.
     *
     * @param {object | null | undefined} user - The user object from GitHub API
     * @returns {boolean} True if the user is a bot, false otherwise
     */
    const isBot = (user) => {
      if (!user || !user.login) return false;
      const login = user.login.toLowerCase();
      return (
        login.includes('[bot]') ||
        login.includes('bot') || // General catch for common bot names
        ['codecov', 'coderabbitai', 'dependabot', 'github-actions'].includes(login) ||
        user.type === 'Bot'
      );
    };

    // Use Promise.all for concurrent processing of PR details (improves performance)
    await Promise.all(
      prs.map(async (pr) => {
        // Fetch all activity data in parallel for performance
        const [comments, reviewActions, inlineComments, commits] = await Promise.all([
          getGeneralComments(pr.number),
          getReviewsActions(pr.number),
          getReviewInlineComments(pr.number),
          getCommits(pr.number),
        ]);

        const daysOpen = now.diff(dayjs(pr.created_at), 'day');
        const prInfo = { number: pr.number };

        // Skip draft PRs from staleness analysis (they're tracked separately)
        if (pr.draft) {
          draftPRs.push(prInfo);
          return;
        }

        // Track latest review state per reviewer (for approval counting)
        const latestReviewStateByReviewer = new Map();

        // Initialize author activity to PR creation time (opening the PR is author's first action)
        let lastActivityByAuthor = dayjs(pr.created_at);
        let lastActivityByReviewer = null;

        // --- 1. Process Explicit Activity (Comments and Reviews) ---
        // Combine all activity types and filter out bots and invalid entries
        const allActivity = [...comments, ...reviewActions, ...inlineComments].filter(
          (a) => !!a.user && !isBot(a.user),
        );

        allActivity.forEach((activity) => {
          // Use 'created_at' for comments/reviewComments and 'submitted_at' for reviews
          const timestamp = dayjs(activity.created_at || activity.submitted_at);

          if (!timestamp.isValid()) return; // Skip invalid timestamps

          const login = activity.user.login;

          if (login === pr.user.login) {
            // Activity by PR Author (comments on their own PR)
            if (timestamp.isAfter(lastActivityByAuthor)) lastActivityByAuthor = timestamp;
          } else {
            // Activity by Reviewer (anyone other than the PR author)
            if (!lastActivityByReviewer || timestamp.isAfter(lastActivityByReviewer)) {
              lastActivityByReviewer = timestamp;
            }
          }

          // --- Track Latest Review State Per User (for approval counting) ---
          // Only reviews have a 'state' field (APPROVED, CHANGES_REQUESTED, etc.)
          if (activity.state) {
            const prior = latestReviewStateByReviewer.get(login);
            // Keep only the most recent review from each reviewer
            if (!prior || timestamp.isAfter(prior.submitted_at)) {
              latestReviewStateByReviewer.set(login, {
                state: activity.state,
                submitted_at: timestamp,
              });
            }
          }
        });

        // --- 2. Incorporate Last Commit Push (Implicit Author Activity) ---
        // Commits represent implicit author activity - pushing new code in response to feedback.
        // Only count commits that were authored by the PR owner (not co-authors or other contributors).
        if (commits && commits.length > 0) {
          // Filter commits by the PR author
          const authorCommits = commits.filter((commit) => {
            // Check GitHub user login (most reliable method)
            const githubAuthor = commit.author?.login;
            const prAuthorLogin = pr.user.login;

            // Match by GitHub username
            if (githubAuthor && githubAuthor === prAuthorLogin) {
              return true;
            }

            // Note: We don't use git email as fallback because it's unreliable
            // (could be different from GitHub account, or commits could be from co-authors)
            return false;
          });

          if (authorCommits.length > 0) {
            // Get the most recent commit by the author (commits are chronologically ordered)
            const latestAuthorCommit = authorCommits[authorCommits.length - 1];
            const commitDate = dayjs(latestAuthorCommit.commit.author.date);

            // Update author's last activity if this commit is more recent
            if (commitDate.isAfter(lastActivityByAuthor)) {
              lastActivityByAuthor = commitDate;
            }
          }
        }

        // ----- Categorize PR -----
        // PRs are categorized in priority order. First matching category wins.

        // 1. Waiting Merge: >= 2 approvals but not merged yet
        const activeApprovals = Array.from(latestReviewStateByReviewer.values()).filter(
          (rev) => rev.state === 'APPROVED',
        );

        if (activeApprovals.length >= 2 && !pr.merged_at) {
          approvedButOpen.push(prInfo);
        }
        // 2. Needs Review:
        // - Author acted last and it's been >2 business days with no reviewer response
        else if (!lastActivityByReviewer || lastActivityByAuthor.isAfter(lastActivityByReviewer)) {
          // Author acted last (or no reviewer activity at all)
          const businessDaysSinceAuthorActivity = getBusinessDaysDiff(lastActivityByAuthor, now);

          if (businessDaysSinceAuthorActivity > 2) {
            needsReview.push(prInfo);
          }
          // If within 2 business days, don't flag (give reviewer time to respond)
        }
        // - After author refreshed commit, just got 1 approval and no other comments in the past 2 business days
        // This catches PRs that have 1 approval but need a second reviewer to approve
        else if (activeApprovals.length === 1) {
          // Check if the single approval came after the author's last activity
          const approvalTimestamp = activeApprovals[0].submitted_at;
          const businessDaysSinceApproval = getBusinessDaysDiff(approvalTimestamp, now);

          // If approval was given >2 business days ago, needs another review
          if (businessDaysSinceApproval > 2) {
            needsReview.push(prInfo);
          }
          // If within 2 business days, don't flag (give second reviewer time to review)
        }
        // 3. Stale PR (Needs Author Followup): Reviewer acted last and it's been >2 business days
        else {
          // Reviewer acted last (lastActivityByReviewer is after lastActivityByAuthor)
          const businessDaysSinceReviewerComment = getBusinessDaysDiff(lastActivityByReviewer, now);

          if (businessDaysSinceReviewerComment > 2) {
            // Reviewer commented >2 business days ago, author hasn't responded
            stalePRs.push(prInfo);
          }
          // If reviewer commented within past 2 business days, don't flag (give author time)
        }

        // Age-based categories (non-overlapping ranges, all PRs are counted)
        if (daysOpen >= 14 && daysOpen < 30) openOver2Weeks.push(prInfo);
        else if (daysOpen >= 30 && daysOpen < 60) openOver1Month.push(prInfo);
        else if (daysOpen >= 60) openOver2Months.push(prInfo);
      }),
    ); // End of prs.map

    // ----- Build Slack Message -----
    const today = now.format('MMM D, YYYY');
    let message = `:bar_chart: *Konflux-UI PR Report — ${today}*\n\n*Open PRs:* ${prs.length}\n`;

    // Calculate date ranges for GitHub filter links (for age-based categories)
    const twoMonthsAgo = now.subtract(60, 'day').format('YYYY-MM-DD');
    const oneMonthAgo = now.subtract(30, 'day').format('YYYY-MM-DD');
    const twoWeeksAgo = now.subtract(14, 'day').format('YYYY-MM-DD');

    // Define all PR categories with their display properties
    // Categories with filterLink show count + link; others show individual PR numbers
    const prCategories = [
      {
        emoji: ':hourglass:',
        name: 'Needs Author Followup',
        prs: stalePRs,
        filterLink: null, // No GitHub filter exists for this custom logic
      },
      {
        emoji: ':eyes:',
        name: 'Needs Review',
        prs: needsReview,
        filterLink: null, // No GitHub filter exists for this custom logic
      },
      {
        emoji: ':white_check_mark:',
        name: 'Waiting Merge',
        prs: approvedButOpen,
        filterLink: null, // No GitHub filter exists for this custom logic
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

    // Format each category in the message
    prCategories.forEach((cat) => {
      if (!cat.prs.length) return; // Skip empty categories

      if (cat.filterLink) {
        // Age-based categories: show count with link to GitHub filter
        message += `${cat.emoji} *${cat.name}:* <${cat.filterLink}|${cat.prs.length} PRs>\n`;
      } else {
        // Action-based categories: show individual PR numbers as clickable links
        // Sort PR numbers from smallest to biggest for consistent, readable output
        const sortedPRs = cat.prs.sort((a, b) => a.number - b.number);
        message += `${cat.emoji} *${cat.name}:* ${sortedPRs.length} PRs (${sortedPRs
          .map(
            (p) => `<https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${p.number}|#${p.number}>`,
          )
          .join(', ')})\n`;
      }
    });

    // Footer message
    if (!prs.length) {
      message += `✨ All PRs are in good shape!\n`;
    } else {
      message += `\n⚡ Please accelerate reviews or merge PRs to keep the repo clean!\n`;
    }

    // ----- Send to Slack or Log -----
    if (TEST_MODE) {
      // In test mode, print the message to console for validation
      console.log('--- TEST_MODE: Slack message (not sent) ---');
      console.log(message);
      console.log('--- End of test output ---');
    } else {
      // Production mode: Send formatted report to Slack webhook
      const response = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          unfurl_links: false, // Don't auto-expand PR links
          unfurl_media: false, // Don't auto-expand media
        }),
      });

      // Fail loudly if Slack rejects the message
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Slack webhook responded with ${response.status}: ${text}`);
      }
      console.log('✅ PR report sent to Slack successfully!');
    }
  } catch (err) {
    console.error('❌ Error checking stale PRs:', err);
    process.exit(1);
  }
};

// ----- Execute Script -----
checkStalePRs().catch((err) => {
  console.error('❌ Error checking stale PRs:', err);
  process.exit(1);
});
