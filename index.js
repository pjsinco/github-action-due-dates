const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment');

function hoursToDue(date) {
  const eventDate = moment(date).local();
  const today = moment().local();
  return eventDate.diff(today, 'hours');
}

function daysToDue(date) {
  const eventDate = moment(date).local();
  const today = moment().local();
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
    const today = moment().local();

    for (const issue of results) {
      const hoursUntilDueDate = hoursToDue(issue.due);
      const daysUntilDueDate = daysToDue(issue.due);
      console.log(issue.title);
      const dueDate = moment(issue.due).local();
      console.log(
        `\tDue on ${dueDate} (compare with ${
          issue.due
        }), in ${daysUntilDueDate} days (${hoursUntilDueDate} hours). Today is ${today}. Hours until tomorrow: ${today.diff(
          moment().add(1, 'days'),
          'hours'
        )}`
      );
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
