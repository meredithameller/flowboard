import { useSession } from './auth'
import AuthScreen from './components/AuthScreen'
import Board from './components/Board'
import { supabase } from './supabase'

export default function App() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <p className="loading" role="status">
        Loading…
      </p>
    )
  }
  if (!session) return <AuthScreen />

  return <Board userEmail={session.user.email} onSignOut={() => void supabase.auth.signOut()} />
}
