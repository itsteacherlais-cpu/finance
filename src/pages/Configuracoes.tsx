import { useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabaseClient'
import { proximaCorSugerida } from '../lib/paletaCategorias'
import { IconeLixeira, IconeSair, IconeSetaBaixo, IconeSetaCima } from '../components/icones'
import type { TipoCategoria, TipoFormaPagamento, TipoTransacao } from '../types'

// Tela onde a usuária cadastra e ajusta suas próprias categorias e
// formas de pagamento — o que alimenta os menus usados no resto do app.
// Para adicionar um novo TIPO de categoria (além de entrada/saída/ambos),
// edite o array `TIPOS_CATEGORIA` abaixo.
const TIPOS_CATEGORIA: { valor: TipoCategoria; rotulo: string }[] = [
  { valor: 'entrada', rotulo: 'Entrada' },
  { valor: 'saida', rotulo: 'Saída' },
  { valor: 'ambos', rotulo: 'Ambos' },
]

const TIPOS_FORMA: { valor: TipoFormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'pix', rotulo: 'PIX' },
  { valor: 'outro', rotulo: 'Outro' },
]

export default function Configuracoes() {
  return (
    <div className="flex flex-col gap-8 pb-4">
      <h1 className="text-xl font-semibold text-cafe-800">Ajustes</h1>

      <SecaoCategorias />
      <SecaoFormasPagamento />
      <SecaoAtalhos />

      <section className="rounded-xl border border-bege-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-cafe-700">Privacidade</h2>
        <p className="mb-3 text-sm text-cafe-500">
          Bloqueia o app agora neste aparelho — da próxima vez, vai pedir o PIN de novo.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 rounded-xl border border-bege-200 px-4 py-2.5 text-sm font-medium text-cafe-600"
        >
          <IconeSair className="h-4 w-4" />
          Bloquear app
        </button>
      </section>
    </div>
  )
}

function SecaoCategorias() {
  const { categorias, criarCategoria, excluirCategoria } = useData()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCategoria>('saida')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    setErro(null)
    setSalvando(true)
    try {
      await criarCategoria({ nome: nome.trim(), tipo, cor: proximaCorSugerida(categorias.length), icone: null })
      setNome('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir(id: string) {
    if (!confirm('Remover esta categoria? Lançamentos antigos ficarão sem categoria.')) return
    await excluirCategoria(id)
  }

  return (
    <section className="rounded-xl border border-bege-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-cafe-700">Categorias</h2>

      <ul className="mb-4 flex flex-col gap-1.5">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-bege-50 px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-cafe-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
              {c.nome}
              <span className="text-xs text-cafe-400">
                ({TIPOS_CATEGORIA.find((t) => t.valor === c.tipo)?.rotulo})
              </span>
            </span>
            <button type="button" onClick={() => aoExcluir(c.id)} aria-label="Excluir categoria" className="shrink-0 text-cafe-400 hover:text-terracota-600">
              <IconeLixeira className="h-4 w-4" />
            </button>
          </li>
        ))}
        {categorias.length === 0 && <p className="text-sm text-cafe-500">Nenhuma categoria ainda.</p>}
      </ul>

      <form onSubmit={aoEnviar} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nova categoria"
            className="flex-1 rounded-lg border border-bege-200 px-3 py-2 text-sm text-cafe-800 outline-none focus:border-oliva-500"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCategoria)}
            className="rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            {TIPOS_CATEGORIA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        {erro && <p className="text-xs text-terracota-600">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-oliva-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Adicionar categoria
        </button>
      </form>
    </section>
  )
}

function SecaoAtalhos() {
  const { atalhosRapidos, categorias, formasPagamento, criarAtalhoRapido, atualizarAtalhoRapido, excluirAtalhoRapido } = useData()
  const [rotulo, setRotulo] = useState('')
  const [tipo, setTipo] = useState<TipoTransacao>('saida')
  const [categoriaId, setCategoriaId] = useState('')
  const [formaPagamentoId, setFormaPagamentoId] = useState('')
  const [valorPadrao, setValorPadrao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo || c.tipo === 'ambos')
  const atalhosOrdenados = [...atalhosRapidos].sort((a, b) => a.ordem - b.ordem)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!rotulo.trim()) return
    setErro(null)
    setSalvando(true)
    try {
      await criarAtalhoRapido({
        rotulo: rotulo.trim(),
        tipo,
        categoria_id: categoriaId || null,
        forma_pagamento_id: formaPagamentoId || null,
        valor_padrao: valorPadrao ? Number(valorPadrao.replace(',', '.')) : null,
        ordem: atalhosRapidos.length,
      })
      setRotulo('')
      setValorPadrao('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir(id: string) {
    if (!confirm('Remover este atalho?')) return
    await excluirAtalhoRapido(id)
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const alvo = atalhosOrdenados[indice + direcao]
    const atual = atalhosOrdenados[indice]
    if (!alvo) return
    await Promise.all([
      atualizarAtalhoRapido(atual.id, { ordem: alvo.ordem }),
      atualizarAtalhoRapido(alvo.id, { ordem: atual.ordem }),
    ])
  }

  return (
    <section className="rounded-xl border border-bege-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold text-cafe-700">Atalhos rápidos</h2>
      <p className="mb-3 text-xs text-cafe-500">
        Botões de 1 toque na tela "Novo". Enquanto não tiver nenhum aqui, o app sugere sozinho a partir do que você mais
        lança.
      </p>

      <ul className="mb-4 flex flex-col gap-1.5">
        {atalhosOrdenados.map((a, indice) => (
          <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-bege-50 px-3 py-2">
            <span className="min-w-0 truncate text-sm text-cafe-700">
              {a.rotulo}
              {a.valor_padrao ? ` · R$ ${a.valor_padrao.toFixed(2).replace('.', ',')}` : ''}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => mover(indice, -1)}
                disabled={indice === 0}
                aria-label="Mover para cima"
                className="text-cafe-400 hover:text-cafe-600 disabled:opacity-30"
              >
                <IconeSetaCima className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mover(indice, 1)}
                disabled={indice === atalhosOrdenados.length - 1}
                aria-label="Mover para baixo"
                className="text-cafe-400 hover:text-cafe-600 disabled:opacity-30"
              >
                <IconeSetaBaixo className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => aoExcluir(a.id)} aria-label="Excluir atalho" className="text-cafe-400 hover:text-terracota-600">
                <IconeLixeira className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
        {atalhosOrdenados.length === 0 && <p className="text-sm text-cafe-500">Nenhum atalho manual ainda.</p>}
      </ul>

      <form onSubmit={aoEnviar} className="flex flex-col gap-2">
        <input
          value={rotulo}
          onChange={(e) => setRotulo(e.target.value)}
          placeholder="Nome do atalho (ex: Mercado - PIX)"
          className="w-full rounded-lg border border-bege-200 px-3 py-2 text-sm text-cafe-800 outline-none focus:border-oliva-500"
        />
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoTransacao)
              setCategoriaId('')
            }}
            className="rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            <option value="saida">Saída</option>
            <option value="entrada">Entrada</option>
          </select>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="flex-1 rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            <option value="">Sem categoria</option>
            {categoriasDoTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <select
            value={formaPagamentoId}
            onChange={(e) => setFormaPagamentoId(e.target.value)}
            className="flex-1 rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            <option value="">Sem forma de pagamento</option>
            {formasPagamento.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          <input
            value={valorPadrao}
            onChange={(e) => setValorPadrao(e.target.value)}
            placeholder="Valor fixo (opcional)"
            inputMode="decimal"
            className="w-36 rounded-lg border border-bege-200 px-3 py-2 text-sm text-cafe-800 outline-none focus:border-oliva-500"
          />
        </div>
        {erro && <p className="text-xs text-terracota-600">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-oliva-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Adicionar atalho
        </button>
      </form>
    </section>
  )
}

function SecaoFormasPagamento() {
  const { formasPagamento, criarFormaPagamento, excluirFormaPagamento } = useData()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoFormaPagamento>('cartao')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    setErro(null)
    setSalvando(true)
    try {
      await criarFormaPagamento({ nome: nome.trim(), tipo })
      setNome('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir(id: string) {
    if (!confirm('Remover esta forma de pagamento? Lançamentos antigos ficarão sem forma de pagamento.')) return
    await excluirFormaPagamento(id)
  }

  return (
    <section className="rounded-xl border border-bege-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-cafe-700">Formas de pagamento</h2>

      <ul className="mb-4 flex flex-col gap-1.5">
        {formasPagamento.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-bege-50 px-3 py-2">
            <span className="text-sm text-cafe-700">
              {f.nome} <span className="text-xs text-cafe-400">({TIPOS_FORMA.find((t) => t.valor === f.tipo)?.rotulo})</span>
            </span>
            <button
              type="button"
              onClick={() => aoExcluir(f.id)}
              aria-label="Excluir forma de pagamento"
              className="shrink-0 text-cafe-400 hover:text-terracota-600"
            >
              <IconeLixeira className="h-4 w-4" />
            </button>
          </li>
        ))}
        {formasPagamento.length === 0 && <p className="text-sm text-cafe-500">Nenhuma forma de pagamento ainda.</p>}
      </ul>

      <form onSubmit={aoEnviar} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nova forma de pagamento"
            className="flex-1 rounded-lg border border-bege-200 px-3 py-2 text-sm text-cafe-800 outline-none focus:border-oliva-500"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoFormaPagamento)}
            className="rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            {TIPOS_FORMA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        {erro && <p className="text-xs text-terracota-600">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-oliva-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Adicionar forma de pagamento
        </button>
      </form>
    </section>
  )
}
