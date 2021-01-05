# :calendar: GitHub Issue Due Dates Action
Add due dates to GitHub issues - issues are automatically tagged with `Overdue` and `Due in 1 week` labels.

## How it works:
1. Add the following snippet to the top of issues you'd like to assign due dates to:
```
---
due: 2019-09-19
---
```
2. Create a `.github/workflows/workflow.yml` file with the following contents:
```
on:
  schedule:
    - cron:  '0 * * * *'
jobs:
  due_dates:
    name: Add labels to issues
    runs-on: ubuntu-latest
    steps:
      - name: GitHub Issue Due Dates Action
        uses: pjsinco/github-action-due-dates@0.1.1
        with:
          GH_TOKEN: "${{ secrets.GH_TOKEN }}"
```
3. Generate a [personal access GitHub token](https://github.com/settings/tokens).
4. Add the following environment variable to your repository secrets: `GH_TOKEN={{your personal access token}}`.

hi
hello
