# FRIDAY Flow: Privacy Policy

Last updated: [DATE]

This policy explains what data the FRIDAY Flow app for Jira Cloud ("the app") processes. The app is provided by
[LEGAL NAME] ("we", "us"). Contact: [SUPPORT_EMAIL].

## Summary

- The app runs entirely on Atlassian's Forge platform. It does not send data to any server outside Atlassian.
- The app does not store your work items. It reads them when you open the page and discards them once the page is built.
- The only thing it stores is which board each person last chose in each space (see "What the app stores").
- The app uses no cookies, analytics or tracking of its own.

## What the app reads

When a person opens FRIDAY Flow in a Jira space, the app reads the space's boards and the chosen board's
configuration (its filter, columns and Kanban sub-filter), and the list of Jira statuses. It then asks Jira for the
work items that are in progress on that board or were done in the last 14 days, and for counts of the other work
items on the board. For each work item it loads, it reads only these fields:

- key and summary
- work type
- assignee display name
- status and status category
- created date, resolution date and the date of the last status category change
- the "Flagged" field, when the site has it

The app reads data as the person viewing the page. It never shows a work item that person cannot already see in Jira.
It does not read comments, descriptions, attachments, worklogs or user email addresses.

## What the app stores

For each person and each Jira space, the app stores the ID of the board that person last selected in FRIDAY Flow,
together with that person's Atlassian account ID, so the page opens on the same board next time. It is stored in
Forge storage, on Atlassian's infrastructure, and is written only when the person changes board. Nothing else is stored.

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

The only personal data the app stores is your Atlassian account ID next to the board you last selected. To have it
deleted, write to [SUPPORT_EMAIL]; it is also removed when the app is uninstalled, under Atlassian's Forge data
retention rules.

## Changes

If the app changes how it processes data, we will update this policy and the date at the top before releasing that change.
