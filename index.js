const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment');

function hoursToDue(date) {
  const eventDate = moment(date).tz('America/Chicago');
  const today = moment().tz('America/Chicago');
  return eventDate.diff(today, 'hours');
}

const context = github.context;

async function run() {
  try {
    const githubToken = core.getInput('GH_TOKEN');
    console.log(githubToken);

    if (!githubToken) {
      throw new Error('Missing GH_TOKEN environment variable');
    }

    const ok = new Octokit(githubToken);

    const issues = await ok.listAllOpenIssues(
      context.repo.owner,
      context.repo.repo
    );

    const results = await ok.getIssuesWithDueDate(issues);

    console.log('okissueswithduedates', results);

    for (const issue of results) {
      const hoursUntilDueDate = hoursToDue(issue.due);
      console.log('okissuewithaduedate');
      console.log(`\tDue on ${issue.due}, in ${hoursUntilDueDate} hours`);
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
