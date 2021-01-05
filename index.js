const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment-timezone');

function getDaysUntilDue(date) {
  const eventDate = moment(date).tz('America/Chicago');
  const today = moment().tz('America/Chicago');
  return eventDate.diff(today, 'days');
}

const context = github.context;

async function run() {
  try {
    const githubToken = core.getInput('GH_TOKEN');

    if (!githubToken) {
      throw new Error('Missing GH_TOKEN environment variable');
    }

    const ok = new Octokit(githubToken);

    const issues = await ok.listAllOpenIssues(
      context.repo.owner,
      context.repo.repo
    );

    const results = await ok.getIssuesWithDueDate(issues);

    //console.log('okissueswithduedates', results);
    // TODO debugging only
    const today = moment().tz('America/Chicago');

    for (const issue of results) {
      const daysUntilDueDate = getDaysUntilDue(issue.due);
      const dueDate = moment(issue.due).tz('America/Chicago');

      console.log(
        issue.title,
        `\tDue on ${dueDate}, in ${daysUntilDueDate} days). Today is ${today}.`
      );
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
