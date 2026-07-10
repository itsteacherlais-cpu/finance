import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import {
  detectarCandidatos,
  proximaOcorrenciaAtualizada,
  quantoJaGuardado,
  ultimaOcorrenciaEstimada,
  valorAGuardarPorMes,
  type CandidatoRecorrencia,
} from '../lib/deteccaoRecorrencia'
import { calcularPrevisao } from '../lib/previsao'
import { estaIgnorada, ignorarSugestao } from '../lib/sugestoesIgnoradas'
import { formatarDataCurta, formatarMoeda } from '../lib/formatacao'
import ModalReservaRecorrente from '../components/ModalReservaRecorrente'
import { IconeCheck, IconeLapis, IconeX } from '../components/icones'
import type { Frequencia, NovaReservaRecorrente, ReservaRecorrente } from '../types'

const ROTULOS_FREQUENCIA: Record<Frequencia, string> = {
  quinzenal: 'A cada 2 semanas',
  mensal: 'Mensal',
  trimestral: 'A cada 3 meses',
  semestral: 'A cada 6 meses',
  anual: 'Anual',
  personalizada: 'Personalizada',
}

export default function ReservasInteligentes() {
  const { transacoes, categorias, reservasRecorrentes, carregando } = useData()

  const [modal, setModal] = useState<'nova' | { candidato: CandidatoRecorrencia } | { reserva: ReservaRecorrente } | null>(null)
  const [versaoIgnoradas, setVersaoIgnoradas] = useState(0)

  const candidatos = useMemo(
    () => detectarCandidatos(transacoes, categorias, reservasRecorrentes),
    [transacoes, categorias, reservasRecorrentes],
  )

  const candidatosVisiveis = useMemo(
    () => candidatos.filter((c) => !estaIgnorada(c.chave)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidatos, versaoIgnoradas],
  )

  const previsao = useMemo(() => calcularPrevisao(transacoes, reservasRecorrentes), [transacoes, reservasRecorrentes])

  function ignorar(candidato: CandidatoRecorrencia) {
    ignorarSugestao(candidato.chave)
    setVersaoIgnoradas((v) => v + 1)
  }

  if (carregando) {
    return <p className="text-sm text-cafe-500">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="text-xl font-semibold text-cafe-800">Reservas Inteligentes</h1>
      <p className="-mt-4 text-sm text-cafe-500">
        Despesas que se repetem (anuais, mensais, quinzenais...) e quanto vale a pena ir guardando por mês para elas.
      </p>

      <section className="rounded-xl border border-bege-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-cafe-700">Previsão para o próximo mês</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-cafe-500">Gasto do dia a dia</p>
            <p className="text-base font-semibold text-cafe-800">{formatarMoeda(previsao.gastoNormalMedio)}</p>
          </div>
          <div>
            <p className="text-xs text-cafe-500">+ Reservas do mês</p>
            <p className="text-base font-semibold text-cafe-800">{formatarMoeda(previsao.somaReservas)}</p>
          </div>
        </div>
        <div className="mt-3 border-t border-bege-100 pt-3">
          <p className="text-xs text-cafe-500">Total estimado</p>
          <p className="text-xl font-semibold text-oliva-600">{formatarMoeda(previsao.previsaoTotal)}</p>
        </div>
      </section>

      {candidatosVisiveis.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-cafe-700">Sugestões automáticas</h2>
          <div className="flex flex-col gap-2">
            {candidatosVisiveis.map((c) => (
              <div key={c.chave} className="rounded-xl border border-bege-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-cafe-800">{c.nome}</p>
                    <p className="text-xs text-cafe-500">
                      {ROTULOS_FREQUENCIA[c.frequencia]} · média de {formatarMoeda(c.valorMedio)} · detectado em{' '}
                      {c.quantidadeOcorrencias} lançamentos
                      {c.confiabilidade === 'baixa' && ' (poucos dados ainda)'}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-cafe-600">
                  Guardar <span className="font-semibold text-oliva-600">{formatarMoeda(valorAGuardarPorMes(c.valorMedio, c.intervaloEmMeses))}</span> por mês
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ candidato: c })}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-oliva-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    <IconeCheck className="h-4 w-4" />
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => ignorar(c)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-bege-200 px-3 py-2 text-sm font-medium text-cafe-600"
                  >
                    <IconeX className="h-4 w-4" />
                    Ignorar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cafe-700">Confirmadas</h2>
          <button type="button" onClick={() => setModal('nova')} className="text-sm font-medium text-oliva-600">
            + Adicionar manualmente
          </button>
        </div>

        {reservasRecorrentes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-bege-200 px-4 py-8 text-center text-sm text-cafe-500">
            Nenhuma reserva confirmada ainda. Confirme uma sugestão acima ou adicione manualmente — vale até para uma
            despesa anual que você só tem 1 mês de histórico.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {reservasRecorrentes.map((r) => {
              const mensal = valorAGuardarPorMes(r.valor_medio, r.intervalo_em_meses)
              const ultima = ultimaOcorrenciaEstimada(r.proxima_ocorrencia, r.intervalo_em_meses)
              const guardado = quantoJaGuardado(ultima, r.valor_medio, r.intervalo_em_meses)
              const proxima = proximaOcorrenciaAtualizada(r.proxima_ocorrencia, r.intervalo_em_meses)
              const progresso = Math.min(100, Math.round((guardado / r.valor_medio) * 100))

              return (
                <div key={r.id} className="rounded-xl border border-bege-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-cafe-800">{r.nome}</p>
                      <p className="text-xs text-cafe-500">
                        {ROTULOS_FREQUENCIA[r.frequencia]} · {formatarMoeda(r.valor_medio)}
                        {proxima && ` · próxima em ${formatarDataCurta(proxima)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal({ reserva: r })}
                      aria-label="Editar reserva"
                      className="shrink-0 text-cafe-400 hover:text-cafe-600"
                    >
                      <IconeLapis className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-cafe-600">
                    Guardar <span className="font-semibold text-oliva-600">{formatarMoeda(mensal)}</span> por mês
                  </p>

                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-cafe-500">
                      <span>Já guardado (estimado)</span>
                      <span>
                        {formatarMoeda(guardado)} de {formatarMoeda(r.valor_medio)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bege-100">
                      <div className="h-full rounded-full bg-oliva-500" style={{ width: `${progresso}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {modal === 'nova' && <ModalReservaRecorrente aoFechar={() => setModal(null)} />}
      {modal && typeof modal === 'object' && 'candidato' in modal && (
        <ModalReservaRecorrente aoFechar={() => setModal(null)} valoresIniciais={candidatoParaReserva(modal.candidato)} />
      )}
      {modal && typeof modal === 'object' && 'reserva' in modal && (
        <ModalReservaRecorrente aoFechar={() => setModal(null)} reserva={modal.reserva} />
      )}
    </div>
  )
}

function candidatoParaReserva(c: CandidatoRecorrencia): Partial<NovaReservaRecorrente> {
  return {
    nome: c.nome,
    categoria_id: c.categoriaId,
    frequencia: c.frequencia,
    intervalo_em_meses: c.intervaloEmMeses,
    valor_medio: c.valorMedio,
    proxima_ocorrencia: c.proximaOcorrencia,
  }
}
