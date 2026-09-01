import { describe, expect, it } from 'vitest'
import { provinceSeeds } from './provinces'

describe('province seeds', () => {
  it('contains 77 unique province codes and names', () => {
    expect(provinceSeeds).toHaveLength(77)
    expect(new Set(provinceSeeds.map(province => province.code))).toHaveLength(77)
    expect(new Set(provinceSeeds.map(province => province.nameTh))).toHaveLength(77)
  })

  it('maps Buriram to the northeast region', () => {
    expect(provinceSeeds.find(province => province.nameTh === 'บุรีรัมย์')).toMatchObject({
      code: '31',
      region: 'NORTHEAST',
    })
  })
})
