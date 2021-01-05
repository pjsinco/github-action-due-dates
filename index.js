const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment-timezone');
const constants = require('./constants');

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
      await ok.removeLabelFromIssue(constants.NEXT_WEEK_TAG_NAME, issueNumber);
      await ok.removeLabelFromIssue(constants.OVERDUE_TAG_NAME, issueNumber);
    }

    const issues = await ok.listAllOpenIssues();

    const results = await ok.getIssuesWithDueDate(issues);

    //console.log('okissueswithduedates', results);
    // TODO debugging only
    const today = moment().tz('America/Chicago');

    for (const issue of results) {
      const daysUntilDueDate = getDaysUntilDue(issue.due);
      const dueDate = moment(issue.due).tz('America/Chicago');

      console.log(issue);

      // TODO debugging only
      console.log(
        issue.title,
        `\tDue on ${dueDate}, in ${daysUntilDueDate} days. Today is ${today}.`
      );

      if (daysUntilDueDate <= 7 && daysUntilDueDate > 0) {
        await removeDueLabels(issue.number);
        await ok.addLabelToIssue(issue.number, [constants.NEXT_WEEK_TAG_NAME]);
        console.log('\tokaddingnextweektag');
      } else if (daysUntilDueDate <= 0) {
        await removeDueLabels(issue.number);
        await ok.addLabelToIssue(issue.number, [constants.OVERDUE_TAG_NAME]);
        console.log('\tokaddingoverduetag');
      } else {
        console.log('\tokwereintheelseclause');
        //removeDueLabels();
      }
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
