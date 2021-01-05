const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment');

function hoursToDue(date) {
  const eventDate = moment(date);
  const today = moment();
  return eventDate.diff(today, 'hours');
}

function daysToDue(date) {
  const eventDate = moment(date);
  const today = moment();
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

    for (const issue of results) {
      const hoursUntilDueDate = hoursToDue(issue.due);
      const daysUntilDueDate = daysToDue(issue.due);
      console.log(issue.title);
      const dueDate = moment(issue.due).format('YYYY-MM-DD');
      console.log(
        `\tDue on ${dueDate} (compare with ${issue.due}), in ${daysUntilDueDate} days (${hoursUntilDueDate} hours)`
      );
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
