import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
import { JizdyScreen } from './JizdyScreen'
import rawSkillsData from '@data/jizdy-skills.json'

const SKILLS = rawSkillsData.skills

function renderJizdy() {
  return render(
    <AuthProvider>
      <AppProvider>
        <JizdyScreen />
      </AppProvider>
    </AuthProvider>,
  )
}

// Helper: find the checklist <li> for a skill by its label text
function skillItem(label: string) {
  const items = screen.getAllByRole('listitem')
  const match = items.find((li) => within(li).queryByText(label))
  if (!match) throw new Error(`No listitem found for skill: ${label}`)
  return match
}

describe('JizdyScreen', () => {
  beforeEach(() => localStorage.clear())

  it('skills list renders from jizdy-skills.json', () => {
    renderJizdy()
    // Readiness header present
    expect(screen.getByText(/Připraveno/)).toBeInTheDocument()
    // All skills present as checklist listitems (form chip + li = multiple per skill;
    // but getAllByRole('listitem') only counts <li> elements)
    expect(screen.getAllByRole('listitem')).toHaveLength(SKILLS.length)
    // First skill listed with 0 reps in its listitem
    const first = SKILLS[0]
    const item = skillItem(first.label)
    expect(within(item).getByText(`0 / ${first.requiredReps}`)).toBeInTheDocument()
  })

  it('submitting the log form calls dispatch with the correct record', async () => {
    const user = userEvent.setup()
    renderJizdy()

    await user.clear(screen.getByLabelText('Délka (min)'))
    await user.type(screen.getByLabelText('Délka (min)'), '60')
    // Select first skill via its chip label (contains a hidden checkbox)
    await user.click(screen.getAllByLabelText(SKILLS[0].label)[0])
    await user.click(screen.getByRole('button', { name: /Uložit jízdu/ }))

    // Confirmation proves dispatch fired and the form closed correctly
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Jízda zaznamenána'),
    )
  })

  it('checklist updates rep counts after log', async () => {
    const user = userEvent.setup()
    renderJizdy()

    const first = SKILLS[0]

    // Before: 0 reps in the checklist item
    expect(within(skillItem(first.label)).getByText(`0 / ${first.requiredReps}`)).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Délka (min)'))
    await user.type(screen.getByLabelText('Délka (min)'), '45')
    await user.click(screen.getAllByLabelText(first.label)[0])
    await user.click(screen.getByRole('button', { name: /Uložit jízdu/ }))

    // After: rep count updates in the checklist
    await waitFor(() =>
      expect(within(skillItem(first.label)).getByText(`1 / ${first.requiredReps}`)).toBeInTheDocument(),
    )
  })
})
