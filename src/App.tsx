import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovoLancamento from './pages/NovoLancamento'
import Transacoes from './pages/Transacoes'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AreaAutenticada />
      </BrowserRouter>
    </AuthProvider>
  )
}

// Mostra a tela de login enquanto não há sessão, e só carrega os dados
// financeiros (DataProvider) depois que a usuária está autenticada.
function AreaAutenticada() {
  const { session, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center text-cafe-500">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="novo" element={<NovoLancamento />} />
          <Route path="transacoes" element={<Transacoes />} />
          <Route path="config" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}
