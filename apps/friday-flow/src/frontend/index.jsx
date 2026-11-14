import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Inline, Stack, Heading, Text, Lozenge, Link, Spinner, SectionMessage, Select, Button, ButtonGroup, Label,
  Modal, ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter, List, ListItem, Icon, Pressable, Tooltip,
  DynamicTable, BarChart, StackBarChart, useProductContext, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { messagesFor, roundDays, daysCell } from './i18n';

const kpiStyle = xcss({ borderRadius: 'border.radius', minWidth: '170px' });
const chartStyle = xcss({ minWidth: '340px' });
const selectStyle = xcss({ minWidth: '220px' });
const refSelectStyle = xcss({ minWidth: '160px' });
// Espaço por cima do título: sem ele, o título fica colado à barra de separadores do Jira.
const headerStyle = xcss({ paddingTop: 'space.300' });
const iconButtonStyle = xcss({ borderRadius: 'border.radius', padding: 'space.050', backgroundColor: 'color.background.neutral.subtle' });
// Abaixo disto, o tempo habitual é fraco: o cartão não fica vermelho (pedido dos agentes de revisão, 15/11/2026).
const MIN_REFERENCE_ITEMS = 10;

// Ícone ⓘ com a explicação ao passar o rato: a ajuda está onde está o número.
function InfoTip({ text }) {
  return (
    <Tooltip content={text}>
      <Icon glyph="info" label={text} size="small" color="color.icon.subtle" />
    </Tooltip>
  );
}

function LabelWithTip({ children, tip }) {
  return (
    <Inline space="space.050" alignBlock="center">
      {children}
      <InfoTip text={tip} />
    </Inline>
  );
}

function Kpi({ label, value, alert = false, notes = [], tip }) {
  return (
    <Box padding="space.150" backgroundColor={alert ? 'color.background.danger' : 'color.background.neutral'} xcss={kpiStyle}>
      <Stack space="space.050">
        <LabelWithTip tip={tip}><Text size="small">{label}</Text></LabelWithTip>
        <Heading size="large">{value == null ? '–' : String(value)}</Heading>
        {notes.filter(Boolean).map((n) => <Text key={n} size="small" color="color.text.subtlest">{n}</Text>)}
      </Stack>
    </Box>
  );
}

function IconButton({ glyph, label, onClick }) {
  return (
    <Tooltip content={label}>
      <Pressable onClick={onClick} xcss={iconButtonStyle}>
        <Icon glyph={glyph} label={label} size="medium" />
      </Pressable>
    </Tooltip>
  );
}

function HelpModal({ t, onClose }) {
  return (
    <Modal onClose={onClose} label={t.helpTitle}>
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
      <ModalFooter><Button appearance="primary" onClick={onClose}>{t.helpClose}</Button></ModalFooter>
    </Modal>
  );
}

function WorkflowModal({ t, workflow, onSave, onReset, onClose }) {
  const options = workflow.columns.map((name) => ({ label: name, value: name }));
  const [start, setStart] = useState(workflow.start);
  const [end, setEnd] = useState(workflow.end);
  const valid = workflow.columns.indexOf(start) >= 0 && workflow.columns.indexOf(start) < workflow.columns.indexOf(end);
  return (
    <Modal onClose={onClose} label={t.settingsTitle}>
      <ModalHeader><ModalTitle>{t.settingsTitle}</ModalTitle></ModalHeader>
      <ModalBody>
        <Stack space="space.200">
          <Text>{t.settingsIntro}</Text>
          <Stack space="space.050">
            <Label labelFor="friday-wf-start">{t.settingsStart}</Label>
            <Select inputId="friday-wf-start" options={options} value={options.find((o) => o.value === start)} onChange={(o) => o && setStart(o.value)} />
          </Stack>
          <Stack space="space.050">
            <Label labelFor="friday-wf-end">{t.settingsEnd}</Label>
            <Select inputId="friday-wf-end" options={options} value={options.find((o) => o.value === end)} onChange={(o) => o && setEnd(o.value)} />
          </Stack>
          {!valid && <SectionMessage appearance="warning"><Text>{t.settingsInvalid}</Text></SectionMessage>}
          <Text size="small" color="color.text.subtlest">{t.settingsNote}</Text>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button appearance="subtle" onClick={onReset}>{t.settingsReset}</Button>
        <Button appearance="primary" isDisabled={!valid} onClick={() => onSave(start, end)}>{t.settingsSave}</Button>
      </ModalFooter>
    </Modal>
  );
}

// Barra de filtros: tudo o que muda a página inteira, junto e por baixo do título.
function FilterBar({ t, boards, selectedId, onBoard, includeBacklog, onAgeFrom, referenceDays, referenceOptions, onReference }) {
  const boardOptions = (boards || []).map((b) => ({ label: b.name, value: b.id }));
  const refOptions = referenceOptions.map((d) => ({ label: t.refOption(d), value: d }));
  return (
    <Inline space="space.300" alignBlock="center" shouldWrap>
      {boards && boards.length > 0 && (
        <Inline space="space.100" alignBlock="center">
          <LabelWithTip tip={t.tipBoard}><Label labelFor="friday-board">{t.boardLabel}</Label></LabelWithTip>
          <Box xcss={selectStyle}>
            <Select inputId="friday-board" appearance="subtle" spacing="compact" options={boardOptions}
              value={boardOptions.find((o) => o.value === selectedId) || null} onChange={(o) => o && onBoard(o.value)} isSearchable={boards.length > 5} />
          </Box>
        </Inline>
      )}
      <Inline space="space.100" alignBlock="center">
        <LabelWithTip tip={t.tipAge}><Text weight="bold">{t.ageFromLabel}</Text></LabelWithTip>
        <ButtonGroup label={t.ageFromLabel}>
          <Button isSelected={!includeBacklog} onClick={() => onAgeFrom(false)}>{t.ageFromStart}</Button>
          <Button isSelected={includeBacklog} onClick={() => onAgeFrom(true)}>{t.ageFromCreated}</Button>
        </ButtonGroup>
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <LabelWithTip tip={t.tipHistory}><Label labelFor="friday-reference">{t.refLabel}</Label></LabelWithTip>
        <Box xcss={refSelectStyle}>
          <Select inputId="friday-reference" appearance="subtle" spacing="compact" options={refOptions}
            value={refOptions.find((o) => o.value === referenceDays)} onChange={(o) => o && onReference(o.value)} />
        </Box>
      </Inline>
    </Inline>
  );
}

function AgingTable({ rows, siteUrl, t, includeBacklog, isBoard }) {
  const head = {
    cells: [
      { key: 'key', content: t.colIssue },
      { key: 'summary', content: t.colSummary },
      { key: 'where', content: isBoard ? t.colColumn : t.colStatus },
      { key: 'assignee', content: t.colAssignee },
      { key: 'age', content: includeBacklog ? t.colAgeCreated : t.colAge },
    ],
  };
  const tableRows = rows.map((r) => ({
    key: r.key,
    cells: [
      { key: 'key', content: siteUrl ? <Link href={`${siteUrl}/browse/${r.key}`} openNewTab>{r.key}</Link> : r.key },
      { key: 'summary', content: r.flagged ? <Inline space="space.050"><Lozenge appearance="moved">{t.blocked}</Lozenge><Text>{r.summary}</Text></Inline> : r.summary },
      { key: 'where', content: isBoard ? (r.column ?? r.status) : r.status },
      { key: 'assignee', content: r.assignee ?? t.unassigned },
      { key: 'age', content: r.above
        ? <Inline space="space.050" alignBlock="center"><Text>{daysCell(r.ageDays)}</Text><Lozenge appearance="removed">{t.aboveTag}</Lozenge></Inline>
        : daysCell(r.ageDays) },
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
  const [modal, setModal] = useState(null); // 'help' | 'workflow' | null

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

  const chooseAgeFrom = (fromCreation) => {
    if (fromCreation === includeBacklog) return;
    setIncludeBacklog(fromCreation);
    invoke('saveBacklogTime', { includeBacklog: fromCreation }).catch(() => {});
  };
  const chooseReference = (days) => {
    if (days === referenceDays) return;
    setReferenceDays(days);
    invoke('saveReferenceDays', { referenceDays: days }).catch(() => {});
    load(selectedId, false, days);
  };
  const chooseBoard = (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    load(id, true);
  };
  const saveWorkflow = (start, end) => {
    setModal(null);
    invoke('saveWorkflow', { boardId: selectedId, start, end }).then(() => load(selectedId)).catch(() => load(selectedId));
  };
  const resetWorkflow = () => {
    setModal(null);
    invoke('saveWorkflow', { boardId: selectedId, reset: true }).then(() => load(selectedId)).catch(() => load(selectedId));
  };

  if (!context) return <Spinner label={t.loading} />;
  const projectKey = view?.projectKey || context.extension?.project?.key || '';
  const boardName = boards?.find((b) => b.id === selectedId)?.name;
  const canEditWorkflow = view?.mode === 'board' && view.workflow;

  return (
    <Stack space="space.300">
      <Box xcss={headerStyle}>
        <Inline spread="space-between" alignBlock="center" shouldWrap>
          <Heading size="large">{t.title(boardName || projectKey)}</Heading>
          <Inline space="space.100" alignBlock="center">
            {canEditWorkflow && <IconButton glyph="settings" label={t.settingsTooltip} onClick={() => setModal('workflow')} />}
            <IconButton glyph="question-circle" label={t.helpTooltip} onClick={() => setModal('help')} />
          </Inline>
        </Inline>
      </Box>
      <FilterBar t={t} boards={boards} selectedId={selectedId} onBoard={chooseBoard} includeBacklog={includeBacklog} onAgeFrom={chooseAgeFrom}
        referenceDays={referenceDays} referenceOptions={referenceOptions} onReference={chooseReference} />
      {boards && boards.length === 0 && <SectionMessage appearance="information"><Text>{t.noBoards}</Text></SectionMessage>}
      <Body view={view} t={t} siteUrl={context.siteUrl?.replace(/\/$/, '')} includeBacklog={includeBacklog} referenceDays={referenceDays} />
      <ModalTransition>
        {modal === 'help' && <HelpModal t={t} onClose={() => setModal(null)} />}
        {modal === 'workflow' && canEditWorkflow && (
          <WorkflowModal t={t} workflow={view.workflow} onSave={saveWorkflow} onReset={resetWorkflow} onClose={() => setModal(null)} />
        )}
      </ModalTransition>
    </Stack>
  );
}

function Body({ view, t, siteUrl, includeBacklog, referenceDays }) {
  if (!view) return <Spinner label={t.loading} />;
  if (view.error) return <SectionMessage appearance="error"><Text>{t.errors[view.error] || t.errors.UNKNOWN}</Text></SectionMessage>;

  const k = view.kpis;
  const isBoard = view.mode === 'board';
  const aging = includeBacklog ? view.aging.created : view.aging.start;
  const ref = includeBacklog ? view.reference.lead : view.reference.cycle;
  const hasRef = ref && ref.n > 0 && !(isBoard === false && !includeBacklog);
  const strongRef = hasRef && ref.n >= MIN_REFERENCE_ITEMS;
  const limit = hasRef ? t.days(Math.max(1, Math.round(ref.p85))) : null;
  const aboveAlert = strongRef && aging.above > 0;

  const bands = isBoard ? (includeBacklog ? view.bands.created : view.bands.start) : null;
  const bandLabel = { ok: t.bandOk, slow: t.bandSlow, late: t.bandLate };
  const columnLabel = (c) => (c.max != null ? t.columnWithLimit(c.name, c.count ?? 0, c.max) : c.name);
  const labelOf = Object.fromEntries((view.columns || []).map((c) => [c.name, columnLabel(c)]));
  const bandData = bands ? bands.map((r) => ({ column: labelOf[r.column] || r.column, band: bandLabel[r.band], count: r.count })) : null;
  const countData = isBoard ? view.columns.map((c) => ({ label: columnLabel(c), count: c.count })) : [];
  const overLimit = isBoard ? view.columns.filter((c) => c.max != null && c.count > c.max) : [];
  const byType = isBoard ? [] : view.byType.map((r) => ({ ...r, label: r.label ?? t.noType }));
  const weeks = (view.throughput || []).map((w) => ({ label: t.weekLabel(w.week), count: w.count }));
  const thisWeek = weeks.length ? weeks[weeks.length - 1].count : null;
  const lastWeek = weeks.length > 1 ? weeks[weeks.length - 2].count : null;

  // Frase-resumo: o que precisa de atenção, em linguagem simples.
  const firstSlow = aging.rows.find((r) => r.above);
  let summary;
  if (k.wip === 0) summary = t.summaryNoWip;
  else if (!hasRef) summary = t.summaryNoRef;
  else if (aging.above > 0 && firstSlow) summary = t.summarySlow(aging.above, limit, firstSlow.key);
  else summary = t.summaryOk(limit);
  if (k.blocked?.total > 0) summary += t.summaryBlocked(k.blocked.total);

  let refLine;
  if (!includeBacklog && !isBoard) refLine = t.refNoBoard;
  else if (!hasRef) refLine = t.refNone(referenceDays);
  else refLine = t.refShort({ p85: limit, days: referenceDays, n: ref.n, metric: includeBacklog ? t.refLead : t.refCycle })
    + (strongRef ? '' : ` ${t.refFew}`);

  return (
    <Stack space="space.300">
      <Heading size="medium">{summary}</Heading>
      <Inline space="space.150" shouldWrap>
        <Kpi label={t.kpiWip} value={k.wip} tip={t.tipWip(isBoard ? view.workflow?.start : null, view.workflow?.end)}
          notes={[isBoard && view.workflow?.start ? t.wipRange(view.workflow.start, view.workflow.end) : null]} />
        <Kpi label={t.kpiAbove} value={hasRef ? aging.above : null} alert={aboveAlert}
          tip={hasRef ? t.tipSlower(limit, referenceDays) : t.tipSlowerNone}
          notes={[hasRef ? t.kpiAboveNote(limit) : t.kpiAboveNone, aboveAlert ? t.needsAttention : null, hasRef && !strongRef ? t.fewData : null]} />
        <Kpi label={t.kpiBlocked} value={k.blocked ? k.blocked.total : null} alert={k.blocked?.total > 0} tip={t.tipBlocked}
          notes={[k.blocked ? t.blockedInBacklog(k.blocked.backlog) : t.noFlaggedShort, k.blocked?.total > 0 ? t.needsAttention : null]} />
        {/* Igual à última barra de «Concluídos por semana», para o cartão e o gráfico contarem o mesmo. */}
        <Kpi label={t.kpiDone} value={thisWeek} tip={t.tipDone} notes={[lastWeek != null ? t.doneLastWeek(lastWeek) : null]} />
      </Inline>

      {view.truncated && <SectionMessage appearance="warning"><Text>{t.truncated(view.limit)}</Text></SectionMessage>}
      {isBoard && view.countFailed && <SectionMessage appearance="warning"><Text>{t.countFailed}</Text></SectionMessage>}
      {isBoard && view.workflow?.overrideIgnored && <SectionMessage appearance="warning"><Text>{t.workflowIgnored}</Text></SectionMessage>}
      {isBoard && !view.ageFromHistory && <SectionMessage appearance="information"><Text>{t.ageApprox}</Text></SectionMessage>}
      {!isBoard && view.backlogUnavailable && <SectionMessage appearance="warning"><Text>{t.backlogUnavailable}</Text></SectionMessage>}
      {!view.hasFlaggedField && <SectionMessage appearance="information"><Text>{t.noFlaggedField}</Text></SectionMessage>}

      <Inline space="space.300" shouldWrap>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <LabelWithTip tip={isBoard ? t.tipAgeChart : t.tipByType}><Heading size="small">{isBoard ? t.ageByColumn : t.byType}</Heading></LabelWithTip>
            {isBoard && bandData && <StackBarChart data={bandData} xAccessor="column" yAccessor="count" colorAccessor="band" height={260} />}
            {isBoard && !bandData && (countData.length ? <BarChart data={countData} xAccessor="label" yAccessor="count" height={260} /> : <Text>{t.noWip}</Text>)}
            {!isBoard && (byType.length ? <BarChart data={byType} xAccessor="label" yAccessor="count" height={260} /> : <Text>{t.noOpen}</Text>)}
            {isBoard && <Text size="small">{view.backlogCount == null ? t.backlogUnknown : t.backlogNote(view.backlogCount)}</Text>}
            {overLimit.map((c) => <Text key={c.name} size="small">{t.overLimit(c.name, c.count, c.max)}</Text>)}
          </Stack>
        </Box>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <LabelWithTip tip={t.tipThroughput}><Heading size="small">{t.throughputTitle}</Heading></LabelWithTip>
            <BarChart data={weeks} xAccessor="label" yAccessor="count" height={260} />
          </Stack>
        </Box>
      </Inline>

      <Stack space="space.100">
        <LabelWithTip tip={t.tipTable}><Heading size="small">{t.oldestWip}</Heading></LabelWithTip>
        <Text>{refLine}</Text>
        <AgingTable rows={aging.rows} siteUrl={siteUrl} t={t} includeBacklog={includeBacklog} isBoard={isBoard} />
      </Stack>
    </Stack>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
