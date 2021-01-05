const Octokit = require('./Octokit');
const core = require('@actions/core');
const github = require('@actions/github');

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

    console.log('okissues', issues);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
