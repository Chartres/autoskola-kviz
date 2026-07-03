import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackCard } from './FeedbackCard'

const feedback = vi.fn()
vi.mock('@/analytics', () => ({ feedback: (...a: unknown[]) => feedback(...a) }))

describe('FeedbackCard', () => {
  beforeEach(() => feedback.mockClear())

  it('is collapsed until opened, then sends Sean Ellis + text and thanks', async () => {
    const user = userEvent.setup()
    render(<FeedbackCard />)

    // collapsed: no send button yet
    expect(screen.queryByRole('button', { name: 'Odeslat' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /Napiš nám/ }))
    // send disabled with no input
    expect(screen.getByRole('button', { name: 'Odeslat' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Hodně by mi chybělo' }))
    await user.type(screen.getByRole('textbox'), 'chybí tmavý režim')
    await user.click(screen.getByRole('button', { name: 'Odeslat' }))

    expect(feedback).toHaveBeenCalledWith({
      sean_ellis: 'very',
      text: '[results] chybí tmavý režim',
    })
    expect(screen.getByText(/Díky/)).toBeVisible()
  })
})
