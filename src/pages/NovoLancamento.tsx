import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { calcularAtalhosRapidos } from '../lib/atalhos'
import { hojeISO } from '../lib/formatacao'
import { IconeUpload } from '../components/icones'
import type { TipoTransacao } from '../types'

interface AtalhoExibicao {
  chave: string
  rotulo: string
  tipo: TipoTransacao
  categoriaId: string | null
  formaPagamentoId: string | null
  valorPadrao: number | null
}

// Tela principal de uso diário: lançar um gasto ou ganho o mais rápido
// possível. Os botões de "atalho" no topo pré-preenchem tipo, categoria
// e forma de pagamento com base no que a usuária mais lança — ela só
// precisa digitar o valor e confirmar.
export default function NovoLancamento() {
  const { categorias, formasPagamento, transacoes, atalhosRapidos, criarTransacao } = useData()
  const navegar = useNavigate()

  const [tipo, setTipo] = useState<TipoTransacao>('saida')
  const [valor, setValor] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [formaPagamentoId, setFormaPagamentoId] = useState('')
  const [data, setData] = useState(hojeISO())
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const nomeCategoria = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? 'Sem categoria'
  const nomeFormaPagamento = (id: string | null) => formasPagamento.find((f) => f.id === id)?.nome ?? 'Sem forma de pagamento'

  // Se a usuária já montou atalhos manualmente em Ajustes, usamos eles.
  // Sem nenhum atalho manual, o app sugere sozinho a partir do que ela
  // mais lança (veja src/lib/atalhos.ts).
  const atalhos: AtalhoExibicao[] = useMemo(() => {
    if (atalhosRapidos.length > 0) {
      return atalhosRapidos.map((a) => ({
        chave: a.id,
        rotulo: a.rotulo,
        tipo: a.tipo,
        categoriaId: a.categoria_id,
        formaPagamentoId: a.forma_pagamento_id,
        valorPadrao: a.valor_padrao,
      }))
    }
    return calcularAtalhosRapidos(transacoes, nomeCategoria, nomeFormaPagamento).map((a) => ({
      chave: a.chave,
      rotulo: a.rotulo,
      tipo: a.tipo,
      categoriaId: a.categoria_id,
      formaPagamentoId: a.forma_pagamento_id,
      valorPadrao: null,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atalhosRapidos, transacoes, categorias, formasPagamento])

  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo || c.tipo === 'ambos')

  function aplicarAtalho(atalho: AtalhoExibicao) {
    setTipo(atalho.tipo)
    setCategoriaId(atalho.categoriaId ?? '')
    setFormaPagamentoId(atalho.formaPagamentoId ?? '')
    setErro(null)
    setSucesso(false)
    if (atalho.valorPadrao) {
      setValor(atalho.valorPadrao.toFixed(2).replace('.', ','))
    } else {
      document.getElementById('valor')?.focus()
    }
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    const valorNumerico = Number(valor.replace(',', '.'))
    if (!valorNumerico || valorNumerico <= 0) {
      setErro('Digite um valor válido, maior que zero.')
      return
    }

    setSalvando(true)
    try {
      await criarTransacao({
        tipo,
        valor: valorNumerico,
        data,
        categoria_id: categoriaId || null,
        forma_pagamento_id: formaPagamentoId || null,
        descricao: descricao.trim() || null,
        recorrente: false,
      })
      setSucesso(true)
      setValor('')
      setDescricao('')
      setTimeout(() => setSucesso(false), 2000)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-cafe-800">Novo lançamento</h1>
        <Link
          to="/importar"
          className="flex items-center gap-1.5 rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm font-medium text-cafe-600"
        >
          <IconeUpload className="h-4 w-4" />
          Importar extrato
        </Link>
      </div>

      {atalhos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-cafe-600">Atalhos rápidos</p>
          <div className="flex flex-wrap gap-2">
            {atalhos.map((a) => (
              <button
                key={a.chave}
                type="button"
                onClick={() => aplicarAtalho(a)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  a.tipo === 'entrada'
                    ? 'border-oliva-400 bg-oliva-500/10 text-oliva-700'
                    : 'border-terracota-400 bg-terracota-500/10 text-terracota-600'
                }`}
              >
                {a.rotulo}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipo('saida')
              setCategoriaId('')
            }}
            className={`rounded-xl border py-3 font-medium ${
              tipo === 'saida' ? 'border-terracota-500 bg-terracota-500 text-white' : 'border-bege-200 bg-white text-cafe-600'
            }`}
          >
            Saída
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo('entrada')
              setCategoriaId('')
            }}
            className={`rounded-xl border py-3 font-medium ${
              tipo === 'entrada' ? 'border-oliva-600 bg-oliva-600 text-white' : 'border-bege-200 bg-white text-cafe-600'
            }`}
          >
            Entrada
          </button>
        </div>

        <div>
          <label htmlFor="valor" className="mb-1 block text-sm font-medium text-cafe-700">
            Valor (R$)
          </label>
          <input
            id="valor"
            inputMode="decimal"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-2xl font-semibold text-cafe-800 outline-none focus:border-oliva-500"
          />
        </div>

        <div>
          <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-cafe-700">
            Categoria
          </label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          >
            <option value="">Selecione...</option>
            {categoriasDoTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="forma" className="mb-1 block text-sm font-medium text-cafe-700">
            Forma de pagamento
          </label>
          <select
            id="forma"
            value={formaPagamentoId}
            onChange={(e) => setFormaPagamentoId(e.target.value)}
            className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          >
            <option value="">Selecione...</option>
            {formasPagamento.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="data" className="mb-1 block text-sm font-medium text-cafe-700">
            Data
          </label>
          <input
            id="data"
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          />
        </div>

        <div>
          <label htmlFor="descricao" className="mb-1 block text-sm font-medium text-cafe-700">
            Descrição (opcional)
          </label>
          <input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Mercado do mês"
            className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          />
        </div>

        {erro && <p className="rounded-lg bg-terracota-500/10 px-3 py-2 text-sm text-terracota-600">{erro}</p>}
        {sucesso && <p className="rounded-lg bg-oliva-500/10 px-3 py-2 text-sm text-oliva-700">Lançamento salvo!</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 rounded-xl bg-oliva-600 px-4 py-3 font-medium text-white transition hover:bg-oliva-700 disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar lançamento'}
          </button>
          <button
            type="button"
            onClick={() => navegar('/transacoes')}
            className="rounded-xl border border-bege-200 bg-white px-4 py-3 font-medium text-cafe-600"
          >
            Ver todas
          </button>
        </div>
      </form>
    </div>
  )
}
