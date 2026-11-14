# FRIDAY Flow: Privacy Policy

Last updated: [DATE]

This policy explains what data the FRIDAY Flow app for Jira Cloud ("the app") processes. The app is provided by
[LEGAL NAME] ("we", "us"). Contact: [SUPPORT_EMAIL].

## Summary

- The app runs entirely on Atlassian's Forge platform. It does not send data to any server outside Atlassian.
- The app does not store your work items. It reads them when you open the page and discards them once the page is built.
- The only things it stores are three display choices per person and space: the selected board, whether age includes time in backlog, and the reference period (see "What the app stores").
- The app uses no cookies, analytics or tracking of its own.

## What the app reads

When a person opens FRIDAY Flow in a Jira space, the app reads the space's boards and the chosen board's
configuration (its filter, columns and Kanban sub-filter), and the list of Jira statuses. It then asks Jira for the
work items that are in progress on that board or were done in the last 14 days, and for counts of the other work
items on the board. For work items in progress and recently finished it also reads their status change history, to know when each one
started and finished. For each work item it loads, it reads only these fields:

- key and summary
- work type
- assignee display name
- status and status category
- created date, resolution date and the date of the last status category change
- the "Flagged" field, when the site has it

The app reads data as the person viewing the page. It never shows a work item that person cannot already see in Jira.
It does not read comments, descriptions, attachments, worklogs or user email addresses.

## What the app stores

For each person and each Jira space, the app stores three display choices, together with that person's Atlassian
account ID, so the page opens the same way next time: the ID of the board last selected in FRIDAY Flow, whether
the person chose to include time in backlog in work item age, and the reference period chosen (30 to 180 days). They are stored in Forge storage, on Atlassian's
infrastructure, and are written only when the person changes one of them.

For each board, the app also stores which columns the team chose as the start and the end of its work, if someone
changed the default. This contains no personal data and applies to everyone who uses that board. Nothing else is stored.

## How the data is used

The data is used only to calculate the numbers, charts and table shown on the page to the person who opened it.
Work item data is not stored. No data is shared, sold or used for any other purpose.

## Logs

If the app fails to read data from Jira, it writes an error message to the Forge logs, which Atlassian retains under its
own policies. The message contains Jira's error response, and we read it only to fix the problem.
It is not used for any other purpose.

## Where the data is processed

The app runs on Atlassian's infrastructure (Forge), in the same environment as your Jira site. See Atlassian's privacy policy
for how Atlassian handles data: https://www.atlassian.com/legal/privacy-policy

## Your rights

The only personal data the app stores is your Atlassian account ID next to your three display choices. To have it
deleted, write to [SUPPORT_EMAIL]; it is also removed when the app is uninstalled, under Atlassian's Forge data
retention rules.

## Changes

If the app changes how it processes data, we will update this policy and the date at the top before releasing that change.
