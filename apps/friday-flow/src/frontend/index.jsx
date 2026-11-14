import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Inline, Stack, Heading, Text, Strong, Lozenge, Link, Spinner, SectionMessage,
  DynamicTable, BarChart, useProductContext, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { messagesFor, roundDays, daysCell } from './i18n';

const MAX_ISSUES = 1000;
const kpiStyle = xcss({ borderRadius: 'border.radius', minWidth: '120px' });
const chartStyle = xcss({ minWidth: '320px' });

function Kpi({ label, value, alert = false }) {
  return (
    <Box padding="space.150" backgroundColor={alert ? 'color.background.danger' : 'color.background.neutral'} xcss={kpiStyle}>
      <Stack space="space.050">
        <Text size="small">{label}</Text>
        <Heading size="large">{value == null ? '–' : String(value)}</Heading>
      </Stack>
    </Box>
  );
}

function AgingTable({ rows, siteUrl, t }) {
  const head = {
    cells: [
      { key: 'key', content: t.colIssue },
      { key: 'summary', content: t.colSummary },
      { key: 'assignee', content: t.colAssignee },
      { key: 'status', content: t.colStatus },
      { key: 'age', content: t.colAge },
    ],
  };
  const tableRows = rows.map((r) => ({
    key: r.key,
    cells: [
      { key: 'key', content: siteUrl ? <Link href={`${siteUrl}/browse/${r.key}`} openNewTab>{r.key}</Link> : r.key },
      { key: 'summary', content: r.flagged ? <Inline space="space.050"><Lozenge appearance="removed">{t.blocked}</Lozenge><Text>{r.summary}</Text></Inline> : r.summary },
      { key: 'assignee', content: r.assignee ?? t.unassigned },
      { key: 'status', content: r.status },
      { key: 'age', content: daysCell(r.ageDays) },
    ],
  }));
  return <DynamicTable head={head} rows={tableRows} emptyView={t.emptyTable} />;
}

function App() {
  const context = useProductContext();
  const [view, setView] = useState(null);
  const t = messagesFor(context?.locale);

  useEffect(() => {
    invoke('getFlowView').then(setView).catch(() => setView({ error: 'UNKNOWN' }));
  }, []);

  if (!view || !context) return <Spinner label={t.loading} />;
  if (view.error) {
    return <SectionMessage appearance="error"><Text>{t.errors[view.error] || t.errors.UNKNOWN}</Text></SectionMessage>;
  }

  const k = view.kpis;
  const siteUrl = context.siteUrl?.replace(/\/$/, '');
  const byType = view.byType.map((r) => ({ ...r, label: r.label ?? t.noType }));
  const wipByAssignee = view.wipByAssignee.map((r) => ({ ...r, label: r.label ?? t.unassigned }));
  const [a1, p50, a2, p85, a3] = t.agingSummary(t.days(roundDays(view.agingP50)), t.days(roundDays(view.agingP85)));

  return (
    <Stack space="space.300">
      <Stack space="space.050">
        <Heading size="large">{t.title(view.projectKey)}</Heading>
        <Text>{t.subtitle(k.doneWindowDays)}</Text>
      </Stack>

      {view.truncated && <SectionMessage appearance="warning"><Text>{t.truncated(MAX_ISSUES)}</Text></SectionMessage>}
      {!view.hasFlaggedField && <SectionMessage appearance="information"><Text>{t.noFlaggedField}</Text></SectionMessage>}

      <Inline space="space.150" shouldWrap>
        <Kpi label={t.kpiOpen} value={k.open} />
        <Kpi label={t.kpiBacklog} value={k.backlog} />
        <Kpi label={t.kpiWip} value={k.wip} />
        <Kpi label={t.kpiBlocked} value={k.blocked} alert={k.blocked > 0} />
        <Kpi label={t.kpiDone(k.doneWindowDays)} value={k.doneRecent} />
      </Inline>

      <Inline space="space.300" shouldWrap>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <Heading size="small">{t.byType}</Heading>
            {byType.length ? <BarChart data={byType} xAccessor="label" yAccessor="count" height={280} /> : <Text>{t.noOpen}</Text>}
          </Stack>
        </Box>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <Heading size="small">{t.wipByAssignee}</Heading>
            {wipByAssignee.length ? <BarChart data={wipByAssignee} xAccessor="label" yAccessor="count" height={280} /> : <Text>{t.noWip}</Text>}
          </Stack>
        </Box>
      </Inline>

      <Stack space="space.100">
        <Heading size="small">{t.oldestWip}</Heading>
        <Text>{a1}<Strong>{p50}</Strong>{a2}<Strong>{p85}</Strong>{a3}</Text>
        <AgingTable rows={view.oldestWip} siteUrl={siteUrl} t={t} />
      </Stack>
    </Stack>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
