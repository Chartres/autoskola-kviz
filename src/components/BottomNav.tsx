import { useApp } from '@/app/AppContext'
import { TAB_VIEWS, type TabView } from '@/app/store'
import type { ReactNode } from 'react'

const ICONS: Record<TabView, ReactNode> = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
  ),
  practice: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  stats: <path d="M5 20V10M12 20V4M19 20v-7" />,
  guide: (
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v14M9 7h6M9 11h6" />
  ),
}

const LABELS: Record<TabView, string> = {
  home: 'Domů',
  practice: 'Procvičovat',
  stats: 'Postup',
  guide: 'Průvodce',
}

export function BottomNav() {
  const { state, dispatch } = useApp()
  return (
    <nav
      aria-label="Hlavní navigace"
      className="sticky bottom-0 z-30 border-t border-sand-800 bg-sand-950/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {TAB_VIEWS.map((tab) => {
          const active = state.view === tab
          return (
            <li key={tab} className="flex-1">
              <button
                type="button"
                onClick={() => dispatch({ type: 'navigate', view: tab })}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors ${
                  active ? 'text-terra-400' : 'text-sand-500 hover:text-sand-300'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[tab]}
                </svg>
                {LABELS[tab]}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
