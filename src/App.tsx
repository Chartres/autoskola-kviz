import { AppProvider, useApp } from '@/app/AppContext'
import { isTabView } from '@/app/store'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthPanel } from '@/components/AuthPanel'
import { BottomNav } from '@/components/BottomNav'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { JizdyScreen } from '@/components/screens/JizdyScreen'
import { PracticeScreen } from '@/components/screens/PracticeScreen'
import { QuizScreen } from '@/components/screens/QuizScreen'
import { ResultsScreen } from '@/components/screens/ResultsScreen'
import { StudyScreen } from '@/components/screens/StudyScreen'
import { StatsScreen } from '@/components/screens/StatsScreen'

function CurrentView() {
  const { state } = useApp()
  switch (state.view) {
    case 'practice':
      return <PracticeScreen />
    case 'stats':
      return <StatsScreen />
    case 'guide':
      return <StudyScreen />
    case 'jizdy':
      return <JizdyScreen />
    case 'quiz':
    case 'exam':
      return <QuizScreen />
    case 'results':
      return <ResultsScreen />
    case 'home':
    default:
      return <HomeScreen />
  }
}

function Shell() {
  const { state } = useApp()
  const tabbed = isTabView(state.view)
  return (
    <div
      className="flex min-h-full flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {tabbed && (
        <header className="flex items-center justify-end px-4 py-2">
          <AuthPanel />
        </header>
      )}
      {/* pb-8 keeps a breathing gap between the last card and the nav; the nav
          itself is sticky (in flow), so content can never end up beneath it. */}
      <main className={`flex-1 ${tabbed ? 'pb-8' : ''}`}>
        <CurrentView />
      </main>
      {tabbed && <BottomNav />}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </AuthProvider>
  )
}
