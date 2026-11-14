import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Inline, Stack, Heading, Text, Strong, Lozenge, Link, Spinner, SectionMessage,
  DynamicTable, BarChart, DonutChart, useProductContext, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const kpiStyle = xcss({ borderRadius: 'border.radius', minWidth: '120px' });
const chartStyle = xcss({ minWidth: '320px' });

const fmt = (n) => (n == null ? '–' : String(n).replace('.', ','));

function Kpi({ label, value, appearance }) {
  return (
    <Box padding="space.150" backgroundColor="color.background.neutral" xcss={kpiStyle}>
      <Stack space="space.050">
        <Text size="small">{label}</Text>
        {appearance ? <Lozenge appearance={appearance} isBold>{fmt(value)}</Lozenge> : <Heading size="large">{fmt(value)}</Heading>}
      </Stack>
    </Box>
  );
}

function AgingTable({ rows, siteUrl }) {
  const head = {
    cells: [
      { key: 'key', content: 'Issue' },
      { key: 'summary', content: 'Resumo' },
      { key: 'assignee', content: 'Responsável' },
      { key: 'status', content: 'Estado' },
      { key: 'age', content: 'Dias em curso' },
    ],
  };
  const tableRows = rows.map((r) => ({
    key: r.key,
    cells: [
      { key: 'key', content: siteUrl ? <Link href={`${siteUrl}/browse/${r.key}`} openNewTab>{r.key}</Link> : r.key },
      { key: 'summary', content: r.flagged ? <Inline space="space.050"><Lozenge appearance="removed">Bloqueado</Lozenge><Text>{r.summary}</Text></Inline> : r.summary },
      { key: 'assignee', content: r.assignee },
      { key: 'status', content: r.status },
      { key: 'age', content: fmt(r.ageDays) },
    ],
  }));
  return <DynamicTable head={head} rows={tableRows} emptyView="Não há trabalho em curso." />;
}

function App() {
  const context = useProductContext();
  const [view, setView] = useState(null);

  useEffect(() => {
    invoke('getFlowView').then(setView).catch(() => setView({ error: 'Não foi possível carregar o FRIDAY.' }));
  }, []);

  if (!view) return <Spinner label="A carregar" />;
  if (view.error) return <SectionMessage appearance="error"><Text>{view.error}</Text></SectionMessage>;

  const k = view.kpis;
  const siteUrl = context?.siteUrl?.replace(/\/$/, '');
  return (
    <Stack space="space.300">
      <Stack space="space.050">
        <Heading size="large">FRIDAY Flow · {view.projectKey}</Heading>
        <Text>Estado atual do fluxo: o que está aberto, em curso, bloqueado e concluído nos últimos {k.doneWindowDays} dias.</Text>
      </Stack>

      {view.truncated && (
        <SectionMessage appearance="warning"><Text>O projeto tem mais de 1000 issues neste filtro; os números contam só as 1000 mais recentes.</Text></SectionMessage>
      )}
      {!view.hasFlaggedField && (
        <SectionMessage appearance="information"><Text>Este site não tem o campo «Flagged»; os bloqueados ficam a zero.</Text></SectionMessage>
      )}

      <Inline space="space.150" shouldWrap>
        <Kpi label="Abertas" value={k.open} />
        <Kpi label="Backlog" value={k.backlog} />
        <Kpi label="Em curso (WIP)" value={k.wip} />
        <Kpi label="Bloqueadas" value={k.blocked} appearance={k.blocked > 0 ? 'removed' : 'success'} />
        <Kpi label={`Concluídas (${k.doneWindowDays} dias)`} value={k.doneRecent} />
      </Inline>

      <Inline space="space.300" shouldWrap>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <Heading size="small">Abertas por tipo</Heading>
            {view.byType.length ? <DonutChart data={view.byType} colorAccessor="label" valueAccessor="count" labelAccessor="label" height={280} /> : <Text>Sem issues abertas.</Text>}
          </Stack>
        </Box>
        <Box xcss={chartStyle}>
          <Stack space="space.100">
            <Heading size="small">WIP por responsável</Heading>
            {view.wipByAssignee.length ? <BarChart data={view.wipByAssignee} xAccessor="label" yAccessor="count" height={280} /> : <Text>Sem trabalho em curso.</Text>}
          </Stack>
        </Box>
      </Inline>

      <Stack space="space.100">
        <Heading size="small">Trabalho em curso mais antigo</Heading>
        <Text>
          Idade mediana: <Strong>{fmt(view.agingP50)} dias</Strong> · 85% do trabalho em curso tem até <Strong>{fmt(view.agingP85)} dias</Strong>.
        </Text>
        <AgingTable rows={view.oldestWip} siteUrl={siteUrl} />
      </Stack>
    </Stack>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
