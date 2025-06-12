import { describe, it, expect } from 'vitest'
import { isNewPR } from './prUtils'

describe('isNewPR utility', () => {
  it('flags first-ever PR when stats go from zero', () => {
    expect(isNewPR(
      { reps: 0, resistanceWeight: 0, resistanceHeight: 0 },
      { rep_count: 5, resistanceWeight: 0, resistanceHeight: 0 }
    )).toBe(true)
  })

  it('flags reps-only PR', () => {
    const current = { reps: 5, resistanceWeight: 50, resistanceHeight: 0 }
    const nextSet = { rep_count: 6, resistanceWeight: 50, resistanceHeight: 0 }
    expect(isNewPR(current, nextSet)).toBe(true)
  })

  it('flags weight-only PR', () => {
    const current = { reps: 5, resistanceWeight: 50, resistanceHeight: 0 }
    const nextSet = { rep_count: 5, resistanceWeight: 55, resistanceHeight: 0 }
    expect(isNewPR(current, nextSet)).toBe(true)
  })

  it('flags height-only PR', () => {
    const current = { reps: 5, resistanceWeight: 50, resistanceHeight: 0 }
    const nextSet = { rep_count: 5, resistanceWeight: 50, resistanceHeight: 10 }
    expect(isNewPR(current, nextSet)).toBe(true)
  })

  it('does not flag a non-PR', () => {
    const current = { reps: 5, resistanceWeight: 50, resistanceHeight: 0 }
    const nextSet = { rep_count: 4, resistanceWeight: 50, resistanceHeight: 0 }
    expect(isNewPR(current, nextSet)).toBe(false)
  })
})
