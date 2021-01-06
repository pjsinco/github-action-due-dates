const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment-timezone');
const constants = require('./constants');
const fm = require('front-matter');

// OVERDUE_TAG_NAME, NEXT_WEEK_TAG_NAME

const context = github.context;

function getDaysUntilDue(date) {
  const eventDate = moment(date).tz('America/Chicago');
  const today = moment().tz('America/Chicago');
  return eventDate.diff(today, 'days');
}

async function run() {
  try {
    const githubToken = core.getInput('GH_TOKEN');

    if (!githubToken) {
      throw new Error('Missing GH_TOKEN environment variable');
    }

    const ok = new Octokit(githubToken, context.repo.owner, context.repo.repo);

    async function removeDueLabels(issueNumber) {
      if (typeof issueNumber === 'undefined') {
        throw new Error('Cannot remove due labels: Missing issue number');
      }

      await ok.removeLabelFromIssue(constants.NEXT_WEEK_TAG_NAME, issueNumber);
      await ok.removeLabelFromIssue(constants.OVERDUE_TAG_NAME, issueNumber);
    }

    const issues = await ok.listAllOpenIssues();

    //const results = ok.getIssuesWithDueDate(issues);
    //console.log('okissueswithduedates', results);

    // TODO debugging only
    const today = moment().tz('America/Chicago');

    for (const issue of issues) {
      const meta = fm(issue.body);

      const due =
        meta.attributes && (meta.attributes.due || meta.attributes.Due);

      // If we have a due date, process the issue
      if (meta.attributes && due) {
        const daysUntilDueDate = getDaysUntilDue(due);
        const dueDate = moment(due).tz('America/Chicago');

        // TODO debugging only
        console.log(
          issue.title,
          `\tDue on ${dueDate}, in ${daysUntilDueDate} days. Today is ${today}.`
        );

        if (daysUntilDueDate <= 7 && daysUntilDueDate >= 0) {
          // We have an item due in the next week

          console.log('\tokneedsnextweektag');

          if (
            !(await ok
              .hasNextWeekLabel(issue.number)
              .catch(err => console.error(err)))
          ) {
            console.log('\t\tokdoesnthavenextweeklabelsoletsaddone');
            await ok
              .addLabelToIssue(issue.number, [constants.NEXT_WEEK_TAG_NAME])
              .catch(err => console.error(err));
          } else {
            console.log('\t\tokalreadyhasnextweeklabel');
          }

          // Remove an overdue label if it has one
          await ok
            .removeLabelFromIssue(issue.number, [constants.OVERDUE_TAG_NAME])
            .catch(err => console.error(err));
        } else if (daysUntilDueDate < 0) {
          // We have an overdue item

          console.log('\tokneedoverduelabel');
          if (
            !(await ok
              .hasOverdueLabel(issue.number)
              .catch(err => console.error(err)))
          ) {
            console.log('\t\tokdoesnthaveoverduelabelsoletsaddone');
            await ok
              .addLabelToIssue(issue.number, [constants.OVERDUE_TAG_NAME])
              .catch(err => console.error(err));
          } else {
            console.log('\t\tokalreadyhasnextweeklabel');
          }

          // Remove a next-week label if it has one
          await ok
            .removeLabelFromIssue(issue.number, [constants.NEXT_WEEK_TAG_NAME])
            .catch(err => console.error(err));
        } else {
          console.log('\tokwereintheelseclauseandthereshouldbenolabels');
          await removeDueLabels(issue.number).catch(err => console.error(err));
        }
      } else {
        // For issues with no due date, remove any due labels
        await removeDueLabels(issue.number).catch(err => console.error(err));
      }
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
