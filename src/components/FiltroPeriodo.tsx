import { calcularIntervalo, RotulosPeriodo, type IntervaloDatas, type OpcaoPeriodo } from '../lib/periodos'

interface Props {
  opcao: OpcaoPeriodo
  personalizado: IntervaloDatas
  onMudarOpcao: (opcao: OpcaoPeriodo) => void
  onMudarPersonalizado: (intervalo: IntervaloDatas) => void
}

// Seletor de período reaproveitado no Painel e em Transações, para a
// usuária escolher "Este mês", "Últimos 3 meses" etc., ou um intervalo
// de datas específico.
export default function FiltroPeriodo({ opcao, personalizado, onMudarOpcao, onMudarPersonalizado }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={opcao}
        onChange={(e) => onMudarOpcao(e.target.value as OpcaoPeriodo)}
        className="rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
      >
        {Object.entries(RotulosPeriodo).map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </select>

      {opcao === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={personalizado.inicio}
            onChange={(e) => onMudarPersonalizado({ ...personalizado, inicio: e.target.value })}
            className="rounded-lg border border-bege-200 bg-white px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          />
          <span className="text-cafe-400">até</span>
          <input
            type="date"
            value={personalizado.fim}
            onChange={(e) => onMudarPersonalizado({ ...personalizado, fim: e.target.value })}
            className="rounded-lg border border-bege-200 bg-white px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          />
        </div>
      )}
    </div>
  )
}

export { calcularIntervalo }
