import { NavLink, Outlet } from 'react-router-dom'
import { IconeCofre, IconeEngrenagem, IconeGrafico, IconeLista, IconeMaisCirculo } from './icones'

const itensNav = [
  { para: '/', rotulo: 'Painel', Icone: IconeGrafico, fim: true },
  { para: '/novo', rotulo: 'Novo', Icone: IconeMaisCirculo, fim: false },
  { para: '/transacoes', rotulo: 'Transações', Icone: IconeLista, fim: false },
  { para: '/reservas', rotulo: 'Reservas', Icone: IconeCofre, fim: false },
  { para: '/config', rotulo: 'Ajustes', Icone: IconeEngrenagem, fim: false },
]

// Estrutura visual principal do app: conteúdo da página + barra de
// navegação fixa embaixo (pensada para uso com o polegar no iPhone).
export default function Layout() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bege-50 print:bg-white">
      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pt-6 pb-24 print:max-w-none print:overflow-visible print:p-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-bege-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] print:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {itensNav.map(({ para, rotulo, Icone, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                  isActive ? 'text-oliva-600' : 'text-cafe-500'
                }`
              }
            >
              <Icone className="h-6 w-6" />
              {rotulo}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
