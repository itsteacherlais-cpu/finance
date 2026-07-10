import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useData } from '../context/DataContext'
import FiltroPeriodo, { calcularIntervalo } from '../components/FiltroPeriodo'
import { agruparPorCategoria, agruparPorMes, calcularSaldoAcumulado } from '../lib/agregacoes'
import { formatarMoeda } from '../lib/formatacao'
import { hojeISO } from '../lib/formatacao'
import type { IntervaloDatas, OpcaoPeriodo } from '../lib/periodos'

const CINZA_EIXO = '#898781'
const LINHA_GRADE = '#e1e0d9'

export default function Dashboard() {
  const { transacoes, categorias, formasPagamento, carregando } = useData()

  const [opcaoPeriodo, setOpcaoPeriodo] = useState<OpcaoPeriodo>('mes-atual')
  const [personalizado, setPersonalizado] = useState<IntervaloDatas>({ inicio: hojeISO(), fim: hojeISO() })
  const [formaFiltro, setFormaFiltro] = useState('todas')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [tipoPizza, setTipoPizza] = useState<'saida' | 'entrada'>('saida')

  const intervalo = calcularIntervalo(opcaoPeriodo, personalizado)

  const transacoesFiltradas = useMemo(
    () =>
      transacoes.filter(
        (t) =>
          (formaFiltro === 'todas' || t.forma_pagamento_id === formaFiltro) &&
          (categoriaFiltro === 'todas' || t.categoria_id === categoriaFiltro),
      ),
    [transacoes, formaFiltro, categoriaFiltro],
  )

  const transacoesDoPeriodo = useMemo(
    () => transacoesFiltradas.filter((t) => t.data >= intervalo.inicio && t.data <= intervalo.fim),
    [transacoesFiltradas, intervalo.inicio, intervalo.fim],
  )

  const totalEntradas = transacoesDoPeriodo.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  const totalSaidas = transacoesDoPeriodo.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0)
  const saldoPeriodo = totalEntradas - totalSaidas

  const fatiasCategoria = useMemo(
    () => agruparPorCategoria(
      transacoesDoPeriodo.filter((t) => t.tipo === tipoPizza),
      categorias,
    ),
    [transacoesDoPeriodo, categorias, tipoPizza],
  )

  const pontosMensais = useMemo(() => agruparPorMes(transacoesFiltradas, 12), [transacoesFiltradas])
  const saldoAcumulado = useMemo(() => calcularSaldoAcumulado(pontosMensais), [pontosMensais])

  if (carregando) {
    return <p className="text-sm text-cafe-500">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="text-xl font-semibold text-cafe-800">Painel</h1>

      <div className="flex flex-col gap-2">
        <FiltroPeriodo
          opcao={opcaoPeriodo}
          personalizado={personalizado}
          onMudarOpcao={setOpcaoPeriodo}
          onMudarPersonalizado={setPersonalizado}
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={formaFiltro}
            onChange={(e) => setFormaFiltro(e.target.value)}
            className="w-fit rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            <option value="todas">Todas as formas de pagamento</option>
            {formasPagamento.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-fit rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CartaoEstatistica rotulo="Entradas" valor={totalEntradas} cor="text-oliva-600" />
        <CartaoEstatistica rotulo="Saídas" valor={totalSaidas} cor="text-terracota-600" />
        <CartaoEstatistica rotulo="Saldo" valor={saldoPeriodo} cor={saldoPeriodo >= 0 ? 'text-oliva-600' : 'text-terracota-600'} />
      </div>

      <section className="rounded-xl border border-bege-200 bg-white p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cafe-700">{tipoPizza === 'saida' ? 'Gastos' : 'Ganhos'} por categoria</h2>
          <div className="flex rounded-lg border border-bege-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTipoPizza('saida')}
              className={`rounded-md px-2.5 py-1 font-medium ${tipoPizza === 'saida' ? 'bg-terracota-500 text-white' : 'text-cafe-500'}`}
            >
              Saídas
            </button>
            <button
              type="button"
              onClick={() => setTipoPizza('entrada')}
              className={`rounded-md px-2.5 py-1 font-medium ${tipoPizza === 'entrada' ? 'bg-oliva-600 text-white' : 'text-cafe-500'}`}
            >
              Entradas
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-cafe-500">No período selecionado</p>
        {fatiasCategoria.length === 0 ? (
          <p className="py-8 text-center text-sm text-cafe-500">
            Nenhuma {tipoPizza === 'saida' ? 'saída' : 'entrada'} registrada neste período.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={fatiasCategoria}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ percent }) => (percent && percent > 0.08 ? `${Math.round(percent * 100)}%` : '')}
                  labelLine={false}
                >
                  {fatiasCategoria.map((fatia) => (
                    <Cell key={fatia.categoriaId} fill={fatia.cor} stroke="#fcfcfb" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor, _nome, item) => [formatarMoeda(Number(valor)), item.payload.nome]}
                  contentStyle={{ borderRadius: 12, borderColor: '#e9dcc0', fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {fatiasCategoria.map((fatia) => (
                <li key={fatia.categoriaId} className="flex items-center gap-1.5 text-xs text-cafe-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: fatia.cor }} />
                  {fatia.nome} · {formatarMoeda(fatia.valor)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-xl border border-bege-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-cafe-700">Entradas vs. saídas por mês</h2>
        <p className="mb-3 text-xs text-cafe-500">Últimos 12 meses</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={pontosMensais} barGap={2} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={LINHA_GRADE} />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: CINZA_EIXO }} axisLine={{ stroke: LINHA_GRADE }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CINZA_EIXO }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              formatter={(valor) => formatarMoeda(Number(valor))}
              contentStyle={{ borderRadius: 12, borderColor: '#e9dcc0', fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'entrada' ? 'Entradas' : 'Saídas')} />
            <Bar dataKey="entrada" name="entrada" fill="#4f7a2e" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="saida" name="saida" fill="#c1704e" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-xl border border-bege-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-cafe-700">Evolução do saldo</h2>
        <p className="mb-3 text-xs text-cafe-500">Últimos 12 meses (acumulado)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={saldoAcumulado}>
            <CartesianGrid vertical={false} stroke={LINHA_GRADE} />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: CINZA_EIXO }} axisLine={{ stroke: LINHA_GRADE }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CINZA_EIXO }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              formatter={(valor) => formatarMoeda(Number(valor))}
              contentStyle={{ borderRadius: 12, borderColor: '#e9dcc0', fontSize: 13 }}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke="#2f7bb8"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2f7bb8', stroke: '#fcfcfb', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}

function CartaoEstatistica({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="rounded-xl border border-bege-200 bg-white px-2 py-2.5">
      <p className="text-xs text-cafe-500">{rotulo}</p>
      <p className={`text-sm font-semibold leading-snug break-words ${cor}`}>{formatarMoeda(valor)}</p>
    </div>
  )
}
