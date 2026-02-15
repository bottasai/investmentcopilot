import { STRATEGY_PRESETS } from '../lib/strategy-presets'

describe('STRATEGY_PRESETS', () => {
    it('should have at least 3 presets', () => {
        expect(STRATEGY_PRESETS.length).toBeGreaterThanOrEqual(3)
    })

    it('each preset should have a non-empty label and value', () => {
        STRATEGY_PRESETS.forEach((preset) => {
            expect(preset.label).toBeTruthy()
            expect(preset.label.length).toBeGreaterThan(0)
            expect(preset.value).toBeTruthy()
            expect(preset.value.length).toBeGreaterThan(10)
        })
    })

    it('preset labels should be unique', () => {
        const labels = STRATEGY_PRESETS.map((p) => p.label)
        const uniqueLabels = new Set(labels)
        expect(uniqueLabels.size).toBe(labels.length)
    })

    it('preset values should be unique', () => {
        const values = STRATEGY_PRESETS.map((p) => p.value)
        const uniqueValues = new Set(values)
        expect(uniqueValues.size).toBe(values.length)
    })

    it('should include common investor types', () => {
        const labels = STRATEGY_PRESETS.map((p) => p.label.toLowerCase())
        expect(labels.some((l) => l.includes('growth'))).toBe(true)
        expect(labels.some((l) => l.includes('value'))).toBe(true)
        expect(labels.some((l) => l.includes('conservative'))).toBe(true)
    })
})
