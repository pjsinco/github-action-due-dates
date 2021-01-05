const github = require('@actions/github');
const core = require('@actions/core');
const fm = require('front-matter');
const OVERDUE_TAG_NAME = require('./constants').OVERDUE_TAG_NAME;

module.exports = class Octokit {
  constructor(token) {
    this.client = github.getOctokit(token);
  }

  async listAllOpenIssues(owner, repo) {
    const { data } = await this.client.issues.listForRepo({
      owner,
      repo,
      state: 'open',
    });
    return data;
  }

  async get(owner, repo, issueNumber) {
    const { data } = await this.client.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return data;
  }

  async addLabelToIssue(owner, repo, issueNumber, labels) {
    const { data } = await this.client.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels,
    });
    return data;
  }

  async removeLabelFromIssue(owner, repo, name, issue_number) {
    try {
      const { data } = await this.client.issues.removeLabel({
        owner,
        repo,
        name,
        issue_number,
      });
      return data;
    } catch (e) {
      // Do not throw error
      return [];
    }
  }

  async getIssuesWithDueDate(rawIssues) {
    return rawIssues.filter(issue => {
      // TODO: Move into utils
      const meta = fm(issue.body);

      const due =
        meta.attributes && (meta.attributes.due || meta.attributes.Due);
      if (meta.attributes && due) {
        return Object.assign(issue, { due });
      }
    });
  }

  async getOverdueIssues(rawIssues) {
    return rawIssues.filter(issue => {
      const activeLabels = issue.labels.map(label => label.name);
      return activeLabels.includes(OVERDUE_TAG_NAME);
    });
  }

  async createIssue(options) {
    return await this.client.issues.create(options);
  }

  async updateIssue(options) {
    return await this.client.issues.update(options);
  }
};
