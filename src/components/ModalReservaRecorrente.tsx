import { useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import { hojeISO } from '../lib/formatacao'
import type { Frequencia, NovaReservaRecorrente, ReservaRecorrente } from '../types'

const FREQUENCIAS: { valor: Frequencia; rotulo: string; intervaloEmMeses: number | null }[] = [
  { valor: 'quinzenal', rotulo: 'A cada 2 semanas', intervaloEmMeses: 0.5 },
  { valor: 'mensal', rotulo: 'Mensal', intervaloEmMeses: 1 },
  { valor: 'trimestral', rotulo: 'A cada 3 meses', intervaloEmMeses: 3 },
  { valor: 'semestral', rotulo: 'A cada 6 meses', intervaloEmMeses: 6 },
  { valor: 'anual', rotulo: 'Anual', intervaloEmMeses: 12 },
  { valor: 'personalizada', rotulo: 'Outro intervalo', intervaloEmMeses: null },
]

interface Props {
  aoFechar: () => void
  reserva?: ReservaRecorrente // presente = editar; ausente = criar
  valoresIniciais?: Partial<NovaReservaRecorrente> // pré-preencher a partir de uma sugestão
}

// Formulário para confirmar uma sugestão automática, criar uma reserva do
// zero (mesmo com pouco histórico) ou editar uma já existente.
export default function ModalReservaRecorrente({ aoFechar, reserva, valoresIniciais }: Props) {
  const { categorias, criarReservaRecorrente, atualizarReservaRecorrente, excluirReservaRecorrente } = useData()

  const base = reserva ?? valoresIniciais
  const [nome, setNome] = useState(base?.nome ?? '')
  const [categoriaId, setCategoriaId] = useState(base?.categoria_id ?? '')
  const [frequencia, setFrequencia] = useState<Frequencia>(base?.frequencia ?? 'mensal')
  const [intervaloPersonalizado, setIntervaloPersonalizado] = useState(
    base?.frequencia === 'personalizada' ? String(base.intervalo_em_meses) : '2',
  )
  const [valorMedio, setValorMedio] = useState(base?.valor_medio ? String(base.valor_medio) : '')
  const [proximaOcorrencia, setProximaOcorrencia] = useState(base?.proxima_ocorrencia ?? hojeISO())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const categoriasSaida = categorias.filter((c) => c.tipo === 'saida' || c.tipo === 'ambos')

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    const valorNumerico = Number(valorMedio.replace(',', '.'))
    if (!nome.trim() || !valorNumerico || valorNumerico <= 0) {
      setErro('Preencha o nome e um valor válido.')
      return
    }

    const definicaoFrequencia = FREQUENCIAS.find((f) => f.valor === frequencia)!
    const intervaloEmMeses =
      definicaoFrequencia.intervaloEmMeses ?? Math.max(0.25, Number(intervaloPersonalizado.replace(',', '.')) || 1)

    setSalvando(true)
    try {
      const dados: NovaReservaRecorrente = {
        nome: nome.trim(),
        categoria_id: categoriaId || null,
        frequencia,
        intervalo_em_meses: intervaloEmMeses,
        valor_medio: valorNumerico,
        confirmada: true,
        proxima_ocorrencia: proximaOcorrencia || null,
      }
      if (reserva) {
        await atualizarReservaRecorrente(reserva.id, dados)
      } else {
        await criarReservaRecorrente(dados)
      }
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir() {
    if (!reserva) return
    if (!confirm('Remover esta reserva? Ela só volta a aparecer se for detectada de novo automaticamente.')) return
    setSalvando(true)
    try {
      await excluirReservaRecorrente(reserva.id)
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cafe-900/40 sm:items-center" onClick={aoFechar}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-cafe-800">
          {reserva ? 'Editar reserva' : 'Nova reserva inteligente'}
        </h2>

        <form onSubmit={aoEnviar} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-cafe-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: IPVA do carro"
              className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-cafe-700">Categoria (opcional)</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            >
              <option value="">Sem categoria</option>
              {categoriasSaida.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-cafe-700">Com que frequência acontece?</label>
            <select
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value as Frequencia)}
              className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            >
              {FREQUENCIAS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          </div>

          {frequencia === 'personalizada' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-cafe-700">A cada quantos meses?</label>
              <input
                inputMode="decimal"
                value={intervaloPersonalizado}
                onChange={(e) => setIntervaloPersonalizado(e.target.value)}
                className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-cafe-700">Valor médio (R$)</label>
            <input
              inputMode="decimal"
              value={valorMedio}
              onChange={(e) => setValorMedio(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-cafe-700">Próxima data prevista</label>
            <input
              type="date"
              value={proximaOcorrencia}
              onChange={(e) => setProximaOcorrencia(e.target.value)}
              className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            />
          </div>

          {erro && <p className="rounded-lg bg-terracota-500/10 px-3 py-2 text-sm text-terracota-600">{erro}</p>}

          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 rounded-xl bg-oliva-600 px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {reserva ? 'Salvar alterações' : 'Confirmar reserva'}
            </button>
            {reserva && (
              <button
                type="button"
                onClick={aoExcluir}
                disabled={salvando}
                className="rounded-xl border border-terracota-500 px-4 py-3 font-medium text-terracota-600 disabled:opacity-60"
              >
                Excluir
              </button>
            )}
            <button type="button" onClick={aoFechar} className="rounded-xl border border-bege-200 px-4 py-3 font-medium text-cafe-600">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
