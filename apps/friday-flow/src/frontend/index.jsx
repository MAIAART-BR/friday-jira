import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Inline, Stack, Heading, Text, Strong, Lozenge, Link, Spinner, SectionMessage, Select, Label,
  DynamicTable, BarChart, useProductContext, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { messagesFor, roundDays, daysCell } from './i18n';

const kpiStyle = xcss({ borderRadius: 'border.radius', minWidth: '120px' });
const chartStyle = xcss({ minWidth: '320px' });
const boardBarStyle = xcss({ borderRadius: 'border.radius', borderColor: 'color.border.selected', borderWidth: 'border.width.selected', borderStyle: 'solid' });
const selectStyle = xcss({ minWidth: '280px' });

function Kpi({ label, value, alert = false, badge = null, note = null }) {
  return (
    <Box padding="space.150" backgroundColor={alert ? 'color.background.danger' : 'color.background.neutral'} xcss={kpiStyle}>
      <Stack space="space.050">
        <Inline space="space.050" alignBlock="center">
          <Text size="small">{label}</Text>
          {badge && <Lozenge appearance="inprogress">{badge}</Lozenge>}
        </Inline>
        <Heading size="large">{value == null ? '–' : String(value)}</Heading>
        {note && <Text size="small">{note}</Text>}
      </Stack>
    </Box>
  );
}

// O seletor de quadro fica logo abaixo do título, com moldura: tem de ser impossível não o ver.
function BoardPicker({ boards, selectedId, onChange, t }) {
  const options = boards.map((b) => ({ label: b.name, value: b.id }));
  const value = options.find((o) => o.value === selectedId) || null;
  return (
    <Box padding="space.150" backgroundColor="color.background.selected" xcss={boardBarStyle}>
      <Inline space="space.200" alignBlock="center" shouldWrap>
        <Label labelFor="friday-board">{t.boardLabel}</Label>
        <Box xcss={selectStyle}>
          <Select inputId="friday-board" options={options} value={value} onChange={(o) => o && onChange(o.value)} isSearchable={boards.length > 5} />
        </Box>
        <Text>{t.boardHelp}</Text>
      </Inline>
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
  const t = messagesFor(context?.locale);
  const [boards, setBoards] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState(null);

  const load = (boardId, remember = false) => {
    setView(null);
    invoke('getFlowView', boardId ? { boardId, remember } : {})
      .then(setView)
      .catch(() => setView({ error: 'UNKNOWN' }));
  };

  useEffect(() => {
    invoke('getBoards')
      .then((r) => {
        if (r.error) { setView(r); return; }
        setBoards(r.boards || []);
        setSelectedId(r.selectedId);
        load(r.selectedId);
      })
      .catch(() => setView({ error: 'UNKNOWN' }));
  }, []);

  const choose = (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    load(id, true);
  };

  if (!context) return <Spinner label={t.loading} />;
  const projectKey = view?.projectKey || context.extension?.project?.key || '';
  const boardName = boards?.find((b) => b.id === selectedId)?.name;

  return (
    <Stack space="space.300">
      <Heading size="large">{t.title(boardName || projectKey)}</Heading>
      {boards && boards.length > 0 && <BoardPicker boards={boards} selectedId={selectedId} onChange={choose} t={t} />}
      {boards && boards.length === 0 && <SectionMessage appearance="information"><Text>{t.noBoards}</Text></SectionMessage>}
      <Body view={view} t={t} siteUrl={context.siteUrl?.replace(/\/$/, '')} />
    </Stack>
  );
}

function Body({ view, t, siteUrl }) {
  if (!view) return <Spinner label={t.loading} />;
  if (view.error) return <SectionMessage appearance="error"><Text>{t.errors[view.error] || t.errors.UNKNOWN}</Text></SectionMessage>;

  const k = view.kpis;
  const byType = view.byType.map((r) => ({ ...r, label: r.label ?? t.noType }));
  const wipByAssignee = view.wipByAssignee.map((r) => ({ ...r, label: r.label ?? t.unassigned }));
  const [a1, p50, a2, p85, a3] = t.agingSummary(t.days(roundDays(view.agingP50)), t.days(roundDays(view.agingP85)));
  const isBoard = view.mode === 'board';

  return (
    <Stack space="space.300">
      <Text>{t.subtitle(k.doneWindowDays)}</Text>
      {view.truncated && <SectionMessage appearance="warning"><Text>{t.truncated(view.limit)}</Text></SectionMessage>}
      {isBoard && view.countFailed && <SectionMessage appearance="warning"><Text>{t.countFailed}</Text></SectionMessage>}
      {!isBoard && view.backlogUnavailable && <SectionMessage appearance="warning"><Text>{t.backlogUnavailable}</Text></SectionMessage>}
      {!view.hasFlaggedField && <SectionMessage appearance="information"><Text>{t.noFlaggedField}</Text></SectionMessage>}

      {isBoard ? (
        <Inline space="space.150" shouldWrap>
          {view.columns.map((c) => (
            <Kpi key={c.name} label={c.name} value={c.count} badge={c.wip ? t.wipColumn : null}
              alert={c.max != null && c.count != null && c.count > c.max} note={c.max != null ? t.wipLimit(c.max) : null} />
          ))}
          <Kpi label={t.kpiWip} value={k.wip} />
          <Kpi label={t.kpiBlocked} value={k.blocked} alert={k.blocked > 0} />
          <Kpi label={t.kpiDone(k.doneWindowDays)} value={k.doneRecent} />
        </Inline>
      ) : (
        <Inline space="space.150" shouldWrap>
          <Kpi label={t.kpiOpen} value={k.open} />
          <Kpi label={t.kpiBacklog} value={k.backlog} />
          <Kpi label={t.kpiWip} value={k.wip} />
          <Kpi label={t.kpiBlocked} value={k.blocked} alert={k.blocked > 0} />
          <Kpi label={t.kpiDone(k.doneWindowDays)} value={k.doneRecent} />
        </Inline>
      )}

      <Inline space="space.300" shouldWrap>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <Heading size="small">{isBoard ? t.byTypeBoard : t.byType}</Heading>
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
