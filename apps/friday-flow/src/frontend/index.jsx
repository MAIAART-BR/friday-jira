import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Inline, Stack, Heading, Text, Strong, Lozenge, Link, Spinner, SectionMessage, Select, Button, Toggle, Label,
  Modal, ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter, List, ListItem,
  DynamicTable, BarChart, useProductContext, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { messagesFor, roundDays, daysCell } from './i18n';

const kpiStyle = xcss({ borderRadius: 'border.radius', minWidth: '120px' });
const chartStyle = xcss({ minWidth: '320px' });
const selectStyle = xcss({ minWidth: '240px' });
// Espaço por cima do título: sem ele, o título fica colado à barra de separadores do Jira.
const headerStyle = xcss({ paddingTop: 'space.300' });
const refSelectStyle = xcss({ minWidth: '170px' });

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

// Seletor de quadro no cabeçalho, à direita do título: discreto mas sempre à vista.
function BoardPicker({ boards, selectedId, onChange, t }) {
  const options = boards.map((b) => ({ label: b.name, value: b.id }));
  const value = options.find((o) => o.value === selectedId) || null;
  return (
    <Inline space="space.100" alignBlock="center">
      <Text color="color.text.subtlest">{t.boardLabel}</Text>
      <Box xcss={selectStyle}>
        <Select inputId="friday-board" appearance="subtle" spacing="compact" options={options} value={value}
          onChange={(o) => o && onChange(o.value)} isSearchable={boards.length > 5} />
      </Box>
    </Inline>
  );
}

// Ajuda: definições e fontes (The Kanban Guide; Little, 1961, 2011).
function HelpButton({ t }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button appearance="subtle" onClick={() => setOpen(true)}>{t.helpButton}</Button>
      <ModalTransition>
        {open && (
          <Modal onClose={() => setOpen(false)} label={t.helpTitle}>
            <ModalHeader><ModalTitle>{t.helpTitle}</ModalTitle></ModalHeader>
            <ModalBody>
              <Stack space="space.200">
                {t.helpSections.map(([title, body]) => (
                  <Stack key={title} space="space.050">
                    <Heading size="xsmall">{title}</Heading>
                    <Text>{body}</Text>
                  </Stack>
                ))}
                <Stack space="space.050">
                  <Heading size="xsmall">{t.helpReferences}</Heading>
                  <List type="unordered">
                    {t.helpRefs.map((r) => <ListItem key={r}><Text size="small">{r}</Text></ListItem>)}
                  </List>
                </Stack>
              </Stack>
            </ModalBody>
            <ModalFooter><Button appearance="primary" onClick={() => setOpen(false)}>{t.helpClose}</Button></ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </>
  );
}

function AgingTable({ rows, siteUrl, t, includeBacklog }) {
  const head = {
    cells: [
      { key: 'key', content: t.colIssue },
      { key: 'summary', content: t.colSummary },
      { key: 'assignee', content: t.colAssignee },
      { key: 'status', content: t.colStatus },
      { key: 'age', content: includeBacklog ? t.colAgeCreated : t.colAge },
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
  const [includeBacklog, setIncludeBacklog] = useState(false);
  const [referenceDays, setReferenceDays] = useState(90);
  const [referenceOptions, setReferenceOptions] = useState([30, 60, 90, 180]);

  const load = (boardId, remember = false, days = referenceDays) => {
    setView(null);
    invoke('getFlowView', boardId ? { boardId, remember, referenceDays: days } : { referenceDays: days })
      .then(setView)
      .catch(() => setView({ error: 'UNKNOWN' }));
  };

  useEffect(() => {
    invoke('getBoards')
      .then((r) => {
        if (r.error) { setView(r); return; }
        setBoards(r.boards || []);
        setSelectedId(r.selectedId);
        setIncludeBacklog(r.includeBacklog === true);
        if (r.referenceOptions) setReferenceOptions(r.referenceOptions);
        setReferenceDays(r.referenceDays || 90);
        load(r.selectedId, false, r.referenceDays || 90);
      })
      .catch(() => setView({ error: 'UNKNOWN' }));
  }, []);

  const toggleBacklog = () => {
    const next = !includeBacklog;
    setIncludeBacklog(next);
    invoke('saveBacklogTime', { includeBacklog: next }).catch(() => {});
  };

  const chooseReference = (days) => {
    if (days === referenceDays) return;
    setReferenceDays(days);
    invoke('saveReferenceDays', { referenceDays: days }).catch(() => {});
    load(selectedId, false, days);
  };

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
      <Box xcss={headerStyle}>
      <Inline spread="space-between" alignBlock="center" shouldWrap>
        <Heading size="large">{t.title(boardName || projectKey)}</Heading>
        <Inline space="space.100" alignBlock="center">
          {boards && boards.length > 0 && <BoardPicker boards={boards} selectedId={selectedId} onChange={choose} t={t} />}
          <HelpButton t={t} />
        </Inline>
      </Inline>
      </Box>
      {boards && boards.length === 0 && <SectionMessage appearance="information"><Text>{t.noBoards}</Text></SectionMessage>}
      <Body view={view} t={t} siteUrl={context.siteUrl?.replace(/\/$/, '')} includeBacklog={includeBacklog} onToggleBacklog={toggleBacklog}
        referenceDays={referenceDays} referenceOptions={referenceOptions} onReference={chooseReference} />
    </Stack>
  );
}

function ReferenceLine({ view, t, includeBacklog, referenceDays, referenceOptions, onReference }) {
  const options = referenceOptions.map((d) => ({ label: t.refOption(d), value: d }));
  const ref = includeBacklog ? view.reference.lead : view.reference.cycle;
  const aging = includeBacklog ? view.aging.created : view.aging.start;
  let sentence;
  if (!includeBacklog && view.mode !== 'board') sentence = t.refNoBoard;
  else if (!ref || ref.n === 0) sentence = t.refNone(referenceDays);
  else {
    sentence = t.refSummary({
      days: referenceDays, n: ref.n, p85: t.days(roundDays(ref.p85)), p50: t.days(roundDays(ref.p50)),
      metric: includeBacklog ? t.refLead : t.refCycle, above: aging.above,
    });
    if (ref.n < 10) sentence += ` ${t.refFew}`;
  }
  return (
    <Stack space="space.075">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Text color="color.text.subtlest">{t.refLabel}</Text>
        <Box xcss={refSelectStyle}>
          <Select inputId="friday-reference" appearance="subtle" spacing="compact" options={options}
            value={options.find((o) => o.value === referenceDays)} onChange={(o) => o && onReference(o.value)} />
        </Box>
      </Inline>
      <Text>{sentence}</Text>
    </Stack>
  );
}

function Body({ view, t, siteUrl, includeBacklog, onToggleBacklog, referenceDays, referenceOptions, onReference }) {
  if (!view) return <Spinner label={t.loading} />;
  if (view.error) return <SectionMessage appearance="error"><Text>{t.errors[view.error] || t.errors.UNKNOWN}</Text></SectionMessage>;

  const k = view.kpis;
  const byType = view.byType.map((r) => ({ ...r, label: r.label ?? t.noType }));
  const wipByAssignee = view.wipByAssignee.map((r) => ({ ...r, label: r.label ?? t.unassigned }));
  const aging = includeBacklog ? view.aging.created : view.aging.start;
  const isBoard = view.mode === 'board';

  return (
    <Stack space="space.300">
      <Text>{t.subtitle(k.doneWindowDays)}</Text>
      {view.truncated && <SectionMessage appearance="warning"><Text>{t.truncated(view.limit)}</Text></SectionMessage>}
      {isBoard && view.countFailed && <SectionMessage appearance="warning"><Text>{t.countFailed}</Text></SectionMessage>}
      {isBoard && !view.ageFromHistory && <SectionMessage appearance="information"><Text>{t.ageApprox}</Text></SectionMessage>}
      {!isBoard && view.backlogUnavailable && <SectionMessage appearance="warning"><Text>{t.backlogUnavailable}</Text></SectionMessage>}
      {!view.hasFlaggedField && <SectionMessage appearance="information"><Text>{t.noFlaggedField}</Text></SectionMessage>}

      {isBoard ? (
        <Inline space="space.150" shouldWrap>
          {view.columns.map((c) => (
            <Kpi key={c.name} label={c.name} value={c.count} badge={c.wip ? t.wipColumn : null}
              alert={c.max != null && c.count != null && c.count > c.max} note={c.max != null ? t.wipLimit(c.max) : null} />
          ))}
          {view.wipColumnCount >= 2 && <Kpi label={t.kpiWip} value={k.wip} />}
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
        <Inline spread="space-between" alignBlock="center" shouldWrap>
          <Heading size="small">{t.oldestWip}</Heading>
          <Inline space="space.050" alignBlock="center">
            <Toggle id="friday-backlog-time" isChecked={includeBacklog} onChange={onToggleBacklog} />
            <Label labelFor="friday-backlog-time">{t.toggleBacklog}</Label>
          </Inline>
        </Inline>
        <ReferenceLine view={view} t={t} includeBacklog={includeBacklog} referenceDays={referenceDays}
          referenceOptions={referenceOptions} onReference={onReference} />
        <AgingTable rows={aging.rows} siteUrl={siteUrl} t={t} includeBacklog={includeBacklog} />
      </Stack>
    </Stack>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
