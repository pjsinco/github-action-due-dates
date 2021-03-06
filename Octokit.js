const github = require('@actions/github');
const core = require('@actions/core');
const fm = require('front-matter');
const OVERDUE_TAG_NAME = require('./constants').OVERDUE_TAG_NAME;
const NEXT_WEEK_TAG_NAME = require('./constants').NEXT_WEEK_TAG_NAME;

module.exports = class Octokit {
  constructor(token, owner, repo) {
    this.client = github.getOctokit(token);
    this.owner = owner;
    this.repo = repo;
  }

  async listAllOpenIssues() {
    const { data } = await this.client.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: 'open',
    });
    return data;
  }

  async get(issueNumber) {
    const { data } = await this.client.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });
    return data;
  }

  async hasOverdueLabel(issueNumber) {
    const { data } = await this.client.issues.listLabelsOnIssue({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    return data.map(item => item.name).includes(OVERDUE_TAG_NAME);
  }

  async hasNextWeekLabel(issue_number) {
    const { data } = await this.client.issues.listLabelsOnIssue({
      owner: this.owner,
      repo: this.repo,
      issue_number,
    });

    return data.map(item => item.name).includes(NEXT_WEEK_TAG_NAME);
  }

  async addLabelToIssue(issue_number, labels) {
    const { data } = await this.client.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number,
      labels,
    });
    return data;
  }

  async removeLabelFromIssue(issue_number, name) {
    try {
      const { data } = await this.client.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        name,
        issue_number,
      });
      return data;
    } catch (e) {
      // Do not throw error
      return [];
    }
  }

  //  getIssuesWithDueDate(rawIssues) {
  //    return rawIssues.filter(issue => {
  //      // TODO: Move into utils
  //      const meta = fm(issue.body);
  //
  //      const due =
  //        meta.attributes && (meta.attributes.due || meta.attributes.Due);
  //      if (meta.attributes && due) {
  //        return Object.assign(issue, { due });
  //      }
  //    });
  //  }

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
