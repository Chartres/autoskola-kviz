import { describe, it, expect } from 'vitest'
import { isAuthLinkHash } from './supabase'

describe('isAuthLinkHash', () => {
  it('recognises the tokens a sign-in link returns with', () => {
    expect(isAuthLinkHash('#access_token=x&expires_in=3600&refresh_token=y&type=magiclink')).toBe(true)
  })

  it('ignores other URL fragments and an unrelated ?code= parameter', () => {
    expect(isAuthLinkHash('')).toBe(false)
    expect(isAuthLinkHash('#okruh')).toBe(false)
    expect(isAuthLinkHash('#error=access_denied')).toBe(false)
  })
})
