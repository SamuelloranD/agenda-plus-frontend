import { LoadingState } from './components/ui/LoadingState'
import { PlatformFooter } from './components/layout/PlatformFooter'
import { useSession } from './features/auth/hooks/useSession'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  const { user, isLoading } = useSession()

  return (
    <div className="app-root">
      <div className="app-content">
        {isLoading ? <LoadingState message="Restaurando sessão…" /> : <AppRoutes session={user} />}
      </div>
      <PlatformFooter />
    </div>
  )
}

export default App
