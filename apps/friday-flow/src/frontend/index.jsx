import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Inline, Stack, Heading, Text, Lozenge, Link, Spinner, SectionMessage, Select, Button, ButtonGroup, Label,
  Modal, ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter, List, ListItem, Icon, Pressable, Tooltip,
  DynamicTable, BarChart, StackBarChart, useProductContext, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { messagesFor, roundDays, daysCell } from './i18n';

// Uma página só (decisão do Artur, 15/11/2026): a frase do topo, os números numa linha, as conclusões com o gráfico
// que as explica, o que está dentro do habitual e, quando faltam dados, um guia do que falta e de como o conseguir.

const selectStyle = xcss({ minWidth: '220px' });
// Espaço por cima do título: sem ele, o título fica colado à barra de separadores do Jira.
const headerStyle = xcss({ paddingTop: 'space.300' });
const iconButtonStyle = xcss({ borderRadius: 'border.radius', padding: 'space.050', backgroundColor: 'color.background.neutral.subtle' });
const cardStyle = xcss({ borderRadius: 'border.radius', borderWidth: 'border.width', borderStyle: 'solid', borderColor: 'color.border', padding: 'space.200' });
const exampleStyle = xcss({ borderRadius: 'border.radius', borderWidth: 'border.width', borderStyle: 'dashed', borderColor: 'color.border', padding: 'space.200' });
const quietStyle = xcss({ borderRadius: 'border.radius', backgroundColor: 'color.background.neutral', padding: 'space.200' });
// Ligação «Aprender a ler este padrão», por padrão. Fica vazia até haver conteúdo publicado (backlog, item 2).
const LEARN_URLS = { inflow: null, tail: null, above: null, blocks: null };
const ITEMS_SHOWN = 5;
const MAX_HISTORY = 180;

// Ícone ⓘ com a explicação ao passar o rato. Abre por cima: por baixo, ficava tapado pela seta do rato.
function InfoTip({ text }) {
  return (
    <Tooltip content={text} position="top">
      <Icon glyph="info" label={text} size="small" color="color.icon.subtle" />
    </Tooltip>
  );
}

function IconButton({ glyph, label, onClick }) {
  return (
    <Tooltip content={label} position="bottom">
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

// Definições: onde o trabalho começa e acaba (por quadro, para toda a equipa), idade e histórico (por pessoa).
function SettingsModal({ t, workflow, includeBacklog, onAgeFrom, referenceDays, referenceOptions, onReference, onSave, onReset, onClose }) {
  const options = (workflow?.columns || []).map((name) => ({ label: name, value: name }));
  const [start, setStart] = useState(workflow?.start);
  const [end, setEnd] = useState(workflow?.end);
  const valid = !workflow || (workflow.columns.indexOf(start) >= 0 && workflow.columns.indexOf(start) < workflow.columns.indexOf(end));
  const refOptions = referenceOptions.map((d) => ({ label: t.refOption(d), value: d }));
  return (
    <Modal onClose={onClose} label={t.settingsTitleAll}>
      <ModalHeader><ModalTitle>{t.settingsTitleAll}</ModalTitle></ModalHeader>
      <ModalBody>
        <Stack space="space.300">
          {workflow && (
            <Stack space="space.150">
              <Heading size="xsmall">{t.settingsTitle}</Heading>
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
          )}
          <Stack space="space.100">
            <Heading size="xsmall">{t.ageFromLabel}</Heading>
            <Text size="small">{t.tipAge}</Text>
            <ButtonGroup label={t.ageFromLabel}>
              <Button isSelected={!includeBacklog} onClick={() => onAgeFrom(false)}>{t.ageFromStart}</Button>
              <Button isSelected={includeBacklog} onClick={() => onAgeFrom(true)}>{t.ageFromCreated}</Button>
            </ButtonGroup>
          </Stack>
          <Stack space="space.100">
            <Label labelFor="friday-reference">{t.refLabel}</Label>
            <Text size="small">{t.tipHistory}</Text>
            <Box xcss={selectStyle}>
              <Select inputId="friday-reference" options={refOptions} value={refOptions.find((o) => o.value === referenceDays)} onChange={(o) => o && onReference(o.value)} />
            </Box>
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        {workflow && <Button appearance="subtle" onClick={onReset}>{t.settingsReset}</Button>}
        {workflow
          ? <Button appearance="primary" isDisabled={!valid} onClick={() => onSave(start, end)}>{t.settingsSave}</Button>
          : <Button appearance="primary" onClick={onClose}>{t.helpClose}</Button>}
      </ModalFooter>
    </Modal>
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

// Os números do quadro numa linha, com a explicação no ⓘ.
function NumbersLine({ view, t }) {
  const k = view.kpis;
  const weeks = view.throughput || [];
  const thisWeek = weeks.length ? weeks[weeks.length - 1].count : null;
  const usual = view.reference?.cycle?.n ? t.days(Math.max(1, Math.round(view.reference.cycle.p85))) : null;
  const parts = [
    t.numWip(k.wip),
    k.blocked ? t.numBlocked(k.blocked.total, k.blocked.backlog) : null,
    thisWeek != null ? t.numDone(thisWeek) : null,
    usual ? t.numUsual(usual) : null,
  ].filter(Boolean);
  return (
    <Inline space="space.075" alignBlock="center" shouldWrap>
      <Text>{parts.join(' · ')}</Text>
      <InfoTip text={t.tipNumbers} />
    </Inline>
  );
}

function ItemsList({ f, t, siteUrl }) {
  const d = (n) => t.days(roundDays(n));
  const shown = f.items.slice(0, ITEMS_SHOWN);
  if (!shown.length) return null;
  const extra = (i) => (f.id === 'tail' ? `${d(i.days)}${i.waitColumn ? ` · ${i.waitColumn}` : ''}`
    : f.id === 'blocks' ? d(i.blockedDays)
      : `${d(i.ageDays)}${i.column ? ` · ${i.column}` : ''}`);
  return (
    <Stack space="space.050">
      <Text weight="bold">{t.findItems}</Text>
      <List type="unordered">
        {shown.map((i) => (
          <ListItem key={i.key}>
            <Inline space="space.075" alignBlock="center" shouldWrap>
              {siteUrl ? <Link href={`${siteUrl}/browse/${i.key}`} openNewTab>{i.key}</Link> : <Text>{i.key}</Text>}
              <Text>{i.summary}</Text>
              <Text color="color.text.subtlest">{extra(i)}</Text>
            </Inline>
          </ListItem>
        ))}
      </List>
      {f.items.length > shown.length && <Text size="small" color="color.text.subtlest">{t.findMore(f.items.length - shown.length)}</Text>}
    </Stack>
  );
}

// O gráfico que explica cada conclusão. Os gráficos do painel antigo passaram para aqui.
function FindingChart({ f, t, view }) {
  if (f.id === 'inflow') {
    const data = f.facts.weeks.flatMap((w) => [
      { week: t.weekLabel(w.week), kind: t.findStarted, count: w.started },
      { week: t.weekLabel(w.week), kind: t.findFinished, count: w.finished },
    ]);
    return <BarChart data={data} xAccessor="week" yAccessor="count" colorAccessor="kind" height={220} />;
  }
  if (f.id === 'tail' && f.facts.histogram?.counts?.length) {
    const w = f.facts.histogram.width;
    const data = f.facts.histogram.counts.map((c, k) => ({ label: t.dayRange(k * w, (k + 1) * w), count: c }));
    return <BarChart data={data} xAccessor="label" yAccessor="count" height={220} />;
  }
  if (f.id === 'above' && view?.bands?.start) {
    const bandLabel = { ok: t.bandOk, slow: t.bandSlow, late: t.bandLate };
    const data = view.bands.start.map((r) => ({ column: r.column, band: bandLabel[r.band], count: r.count }));
    return <StackBarChart data={data} xAccessor="column" yAccessor="count" colorAccessor="band" height={220} />;
  }
  return null;
}

function FindingCard({ f, t, siteUrl, view, example = false }) {
  const m = t.find[f.id];
  const d = (n) => t.days(roundDays(n));
  return (
    <Box xcss={example ? exampleStyle : cardStyle}>
      <Stack space="space.150">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          {example && <Lozenge appearance="new">{t.exampleTag}</Lozenge>}
          <Heading size="small">{m.title(f.facts)}</Heading>
        </Inline>
        {example && <Text size="small" color="color.text.subtlest">{t.exampleNote}</Text>}
        <Stack space="space.050"><Text weight="bold">{t.findSeen}</Text><Text>{m.seen(f.facts, d)}</Text></Stack>
        <FindingChart f={f} t={t} view={view} />
        <Stack space="space.050"><Text weight="bold">{t.findMeans}</Text><Text>{m.means}</Text></Stack>
        <Stack space="space.050"><Text weight="bold">{t.findTodo}</Text><Text>{m.todo(f.facts)}</Text></Stack>
        {!example && <ItemsList f={f} t={t} siteUrl={siteUrl} />}
        <Text size="small" color="color.text.subtlest">{`${t.findCaveat}: ${m.caveat}`}</Text>
        {!example && LEARN_URLS[f.id] && <Link href={LEARN_URLS[f.id]} openNewTab>{t.learn}</Link>}
      </Stack>
    </Box>
  );
}

// Um exemplo com dados fictícios, claramente marcado: mostra o que a página vai dizer quando houver dados.
const EXAMPLE = {
  id: 'tail',
  fired: true,
  facts: { n: 42, p50: 3, p85: 19, p95: 61, waitColumn: 'Waiting for QA', waitCount: 3, slowestCount: 5, histogram: { width: 7, counts: [24, 7, 4, 2, 1, 0, 1, 0, 2, 1] } },
  items: [],
};

// O que está dentro do habitual: também é informação, e a página nunca fica vazia.
function AllGood({ view, t }) {
  const d = (n) => t.days(roundDays(n));
  const ok = view.findings.filter((f) => !f.fired && f.enoughData);
  const weeks = (view.throughput || []).map((w) => ({ label: t.weekLabel(w.week), count: w.count }));
  const hasWeeks = weeks.some((w) => w.count > 0);
  if (!ok.length && !hasWeeks) return null;
  return (
    <Box xcss={quietStyle}>
      <Stack space="space.150">
        <Heading size="small">{t.okTitle}</Heading>
        {ok.length > 0 && <List type="unordered">{ok.map((f) => <ListItem key={f.id}><Text>{t.find[f.id].ok(f.facts, d)}</Text></ListItem>)}</List>}
        {hasWeeks && (
          <Stack space="space.050">
            <Inline space="space.075" alignBlock="center"><Text weight="bold">{t.throughputTitle}</Text><InfoTip text={t.tipThroughput} /></Inline>
            <BarChart data={weeks} xAccessor="label" yAccessor="count" height={200} />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

/**
 * O que falta para o FRIDAY ler o quadro, e como o conseguir. Cada ponto diz o que é preciso, o que existe e como resolver.
 * Só aparece quando falta alguma coisa.
 */
function Guide({ view, t, referenceDays, onLongerHistory, onSettings, onDemo }) {
  const L = view.limits || {};
  const f = Object.fromEntries((view.findings || []).map((x) => [x.id, x]));
  const doneWithStart = view.reference?.cycle?.n ?? 0;
  const weeks = view.throughput || [];
  const perWeek = weeks.slice(-4).reduce((s, w) => s + w.count, 0) / 4;
  const need = Math.max(L.tailMinItems || 20, L.aboveMinItems || 10);
  const missing = Math.max(0, need - doneWithStart);
  const steps = [];

  steps.push({
    key: 'board', ok: true,
    title: t.guideBoardOk(view.workflow?.start, view.workflow?.end),
    how: [t.guideBoardHow],
    action: <Button appearance="link" onClick={onSettings}>{t.guideBoardAction}</Button>,
  });
  if (missing > 0) {
    steps.push({
      key: 'done', ok: false,
      title: t.guideDone(doneWithStart, need, referenceDays),
      how: [t.guideDoneMove, perWeek > 0 ? t.guideDoneWait(Math.ceil(missing / perWeek)) : t.guideDoneNone],
      action: referenceDays < MAX_HISTORY ? <Button appearance="primary" onClick={onLongerHistory}>{t.guideDoneAction(MAX_HISTORY)}</Button> : null,
    });
  }
  if (f.inflow && !f.inflow.enoughData) {
    steps.push({ key: 'recent', ok: false, title: t.guideRecent(f.inflow.facts.finished, L.inflowMinFinished || 8), how: [t.guideRecentHow] });
  }
  steps.push(view.hasFlaggedField
    ? { key: 'flag', ok: true, title: t.guideFlagOk, how: [t.guideFlagHow] }
    : { key: 'flag', ok: false, title: t.guideFlagMissing, how: [t.guideFlagMissingHow] });
  if (!view.ageFromHistory) steps.push({ key: 'history', ok: false, title: t.guideHistory, how: [t.guideHistoryHow] });

  if (!steps.some((s) => !s.ok)) return null;
  return (
    <Box xcss={cardStyle}>
      <Stack space="space.200">
        <Stack space="space.050">
          <Heading size="small">{t.guideTitle}</Heading>
          <Text>{t.guideIntro}</Text>
          <Inline><Button appearance="primary" onClick={() => onDemo(true)}>{t.demoEnter}</Button></Inline>
        </Stack>
        {steps.map((s) => (
          <Stack key={s.key} space="space.075">
            <Inline space="space.100" alignBlock="center">
              <Icon glyph={s.ok ? 'check-circle' : 'warning'} label={s.ok ? t.guideOk : t.guideMissing} color={s.ok ? 'color.icon.success' : 'color.icon.warning'} />
              <Text weight="bold">{s.title}</Text>
            </Inline>
            {s.how.map((h) => <Text key={h}>{h}</Text>)}
            {s.action || null}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
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
  const [modal, setModal] = useState(null); // 'help' | 'settings' | null
  const [demo, setDemo] = useState(false);

  const load = (boardId, remember = false, days = referenceDays, asDemo = demo) => {
    setView(null);
    invoke('getFlowView', asDemo ? { demo: true, referenceDays: days } : boardId ? { boardId, remember, referenceDays: days } : { referenceDays: days })
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
    if (id === selectedId && !demo) return;
    setSelectedId(id);
    setDemo(false);
    load(id, true, referenceDays, false);
  };
  const toggleDemo = (on) => {
    setDemo(on);
    load(selectedId, false, referenceDays, on);
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
  const boardOptions = (boards || []).map((b) => ({ label: b.name, value: b.id }));
  const workflow = view?.mode === 'board' && !view.demo ? view.workflow : null;

  return (
    <Stack space="space.300">
      <Box xcss={headerStyle}>
        <Inline spread="space-between" alignBlock="center" shouldWrap>
          <Inline space="space.200" alignBlock="center" shouldWrap>
            <Heading size="large">{t.titleShort}</Heading>
            {boards && boards.length > 0 && (
              <Inline space="space.075" alignBlock="center">
                <Box xcss={selectStyle}>
                  <Select inputId="friday-board" appearance="subtle" spacing="compact" options={boardOptions}
                    value={boardOptions.find((o) => o.value === selectedId) || null} onChange={(o) => o && chooseBoard(o.value)} isSearchable={boards.length > 5} />
                </Box>
                <InfoTip text={t.tipBoard} />
              </Inline>
            )}
            {boards && boards.length === 0 && <Text color="color.text.subtlest">{projectKey}</Text>}
          </Inline>
          <Inline space="space.100" alignBlock="center">
            <IconButton glyph="settings" label={t.settingsTooltipAll} onClick={() => setModal('settings')} />
            <IconButton glyph="question-circle" label={t.helpTooltip} onClick={() => setModal('help')} />
          </Inline>
        </Inline>
      </Box>
      <Body view={view} t={t} siteUrl={view?.demo ? null : context.siteUrl?.replace(/\/$/, '')} includeBacklog={includeBacklog} referenceDays={referenceDays}
        hasBoards={Boolean(boards && boards.length)} onLongerHistory={() => chooseReference(MAX_HISTORY)} onSettings={() => setModal('settings')} onDemo={toggleDemo} />
      <ModalTransition>
        {modal === 'help' && <HelpModal t={t} onClose={() => setModal(null)} />}
        {modal === 'settings' && (
          <SettingsModal t={t} workflow={workflow} includeBacklog={includeBacklog} onAgeFrom={chooseAgeFrom}
            referenceDays={referenceDays} referenceOptions={referenceOptions} onReference={chooseReference}
            onSave={saveWorkflow} onReset={resetWorkflow} onClose={() => setModal(null)} />
        )}
      </ModalTransition>
    </Stack>
  );
}

function Body({ view, t, siteUrl, includeBacklog, referenceDays, hasBoards, onLongerHistory, onSettings, onDemo }) {
  const [showAll, setShowAll] = useState(false);
  if (!view) return <Spinner label={t.loading} />;
  if (view.error) return <SectionMessage appearance="error"><Text>{t.errors[view.error] || t.errors.UNKNOWN}</Text></SectionMessage>;

  const isBoard = view.mode === 'board' && Array.isArray(view.findings);
  const aging = includeBacklog ? view.aging.created : view.aging.start;
  const fired = isBoard ? view.findings.filter((f) => f.fired) : [];
  const lacking = isBoard ? view.findings.filter((f) => !f.fired && !f.enoughData && !f.unavailable) : [];

  let headline;
  if (!isBoard) headline = t.headNoBoard;
  else if (fired.length > 0) headline = t.headFired(fired.length);
  else if (lacking.length > 0) headline = t.headLacking;
  else headline = t.headAllGood;

  const notices = [
    view.truncated ? t.truncated(view.limit) : null,
    isBoard && view.countFailed ? t.countFailed : null,
    isBoard && view.workflow?.overrideIgnored ? t.workflowIgnored : null,
  ].filter(Boolean);

  return (
    <Stack space="space.300">
      {view.demo && (
        <SectionMessage appearance="discovery" title={t.demoTitle}>
          <Stack space="space.100">
            <Text>{t.demoBanner}</Text>
            <Inline><Button onClick={() => onDemo(false)}>{t.demoExit}</Button></Inline>
          </Stack>
        </SectionMessage>
      )}
      <Stack space="space.100">
        <Heading size="medium">{headline}</Heading>
        <NumbersLine view={view} t={t} />
      </Stack>
      {notices.map((n) => <SectionMessage key={n} appearance="warning"><Text>{n}</Text></SectionMessage>)}

      {!isBoard && (
        <Box xcss={cardStyle}>
          <Stack space="space.100">
            <Heading size="small">{t.guideNoBoardTitle}</Heading>
            <Text>{hasBoards ? t.guideNoBoardChoose : t.guideNoBoardCreate}</Text>
            <Inline><Button appearance="primary" onClick={() => onDemo(true)}>{t.demoEnter}</Button></Inline>
          </Stack>
        </Box>
      )}

      {fired.map((f) => <FindingCard key={f.id} f={f} t={t} siteUrl={siteUrl} view={view} />)}

      {isBoard && !view.demo && <Guide view={view} t={t} referenceDays={referenceDays} onLongerHistory={onLongerHistory} onSettings={onSettings} onDemo={onDemo} />}
      {isBoard && !view.demo && fired.length === 0 && lacking.length > 0 && <FindingCard f={EXAMPLE} t={t} example />}
      {isBoard && <AllGood view={view} t={t} />}

      <Stack space="space.100">
        <Inline>
          <Button appearance="subtle" onClick={() => setShowAll(!showAll)}>{showAll ? t.hideAll : t.showAll(view.kpis.wip)}</Button>
        </Inline>
        {showAll && <AgingTable rows={aging.rows} siteUrl={siteUrl} t={t} includeBacklog={includeBacklog} isBoard={view.mode === 'board'} />}
      </Stack>
    </Stack>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
