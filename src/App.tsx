import { LoadingState } from './components/ui/LoadingState'
import { useSession } from './features/auth/hooks/useSession'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  const { user, isLoading } = useSession()

  if (isLoading) {
    return <LoadingState message="Restaurando sessão…" />
  }

  return <AppRoutes session={user} />
}

export default App
