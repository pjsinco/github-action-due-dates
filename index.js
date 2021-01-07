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
          `\n${issue.title}`,
          `\n\tDue in ${daysUntilDueDate} days, on ${dueDate}.\n\tToday is ${today}.`
        );

        if (daysUntilDueDate <= 7 && daysUntilDueDate >= 0) {
          /**
           *
           * We have an item due in the next week
           *
           */

          console.log('\tNeeds "NEXT WEEK" label.');

          if (
            !(await ok
              .hasNextWeekLabel(issue.number)
              .catch(err => console.error(err)))
          ) {
            console.log(
              '\t\t** Doesn\'t have a "NEXT WEEK" label, so let\'s add one. **'
            );
            await ok
              .addLabelToIssue(issue.number, [constants.NEXT_WEEK_TAG_NAME])
              .catch(err => console.error(err));
          } else {
            console.log('\t\tAlready has a "NEXT WEEK" label.');
          }

          // Remove an overdue label if it has one
          await ok
            .removeLabelFromIssue(issue.number, [constants.OVERDUE_TAG_NAME])
            .catch(err => console.error(err));
        } else if (daysUntilDueDate < 0) {
          /**
           *
           * We have an overdue item
           *
           */

          console.log('\tNeeds "OVERDUE" label.');
          if (
            !(await ok
              .hasOverdueLabel(issue.number)
              .catch(err => console.error(err)))
          ) {
            console.log(
              '\t\t** Doesn\'t have an "OVERDUE" label, so let\'s add one. **'
            );
            await ok
              .addLabelToIssue(issue.number, [constants.OVERDUE_TAG_NAME])
              .catch(err => console.error(err));
          } else {
            console.log('\t\tAlready has an "OVERDUE" label.');
          }

          // Remove a next-week label if it has one
          await ok
            .removeLabelFromIssue(issue.number, [constants.NEXT_WEEK_TAG_NAME])
            .catch(err => console.error(err));
        } else {
          /**
           *
           * We have an item that needs no due-date labels
           *
           */

          console.log('\tThis item should have no labels.');
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
