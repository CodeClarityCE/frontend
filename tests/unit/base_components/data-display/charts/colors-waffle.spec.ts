import { describe, it, expect, vi } from 'vitest'
import { interpolateColors, type ColorsInterpolateOptions } from '@/base_components/data-display/charts/colors-waffle'

describe('colors-waffle utilities', () => {
  describe('interpolateColors', () => {
    const mockColorScale = vi.fn((point: number) => `color-${point}`)

    beforeEach(() => {
      mockColorScale.mockClear()
    })

    describe('Basic Functionality', () => {
      it('generates correct number of colors', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: false
        }

        const result = interpolateColors(5, mockColorScale, options)
        expect(result).toHaveLength(5)
        expect(mockColorScale).toHaveBeenCalledTimes(5)
      })

      it('calls color scale with correct interpolated points', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: false
        }

        interpolateColors(4, mockColorScale, options)

        // For 4 items from 0 to 100: interval = 25
        // Points should be: 0, 25, 50, 75
        expect(mockColorScale).toHaveBeenNthCalledWith(1, 0)
        expect(mockColorScale).toHaveBeenNthCalledWith(2, 25)
        expect(mockColorScale).toHaveBeenNthCalledWith(3, 50)
        expect(mockColorScale).toHaveBeenNthCalledWith(4, 75)
      })

      it('returns array of colors from color scale', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 10,
          colorEnd: 90,
          useEndAsStart: false
        }

        const result = interpolateColors(3, mockColorScale, options)
        
        // Should return the mock color scale results - use flexible floating point matching
        expect(result).toHaveLength(3)
        expect(result[0]).toBe('color-10')
        expect(result[1]).toMatch(/color-36\.666666666666\d+/)
        expect(result[2]).toMatch(/color-63\.333333333333\d+/)
      })
    })

    describe('useEndAsStart Option', () => {
      it('interpolates from end to start when useEndAsStart is true', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: true
        }

        interpolateColors(4, mockColorScale, options)

        // For 4 items from 100 to 0: interval = 25
        // Points should be: 100, 75, 50, 25
        expect(mockColorScale).toHaveBeenNthCalledWith(1, 100)
        expect(mockColorScale).toHaveBeenNthCalledWith(2, 75)
        expect(mockColorScale).toHaveBeenNthCalledWith(3, 50)
        expect(mockColorScale).toHaveBeenNthCalledWith(4, 25)
      })

      it('interpolates from start to end when useEndAsStart is false', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 20,
          colorEnd: 80,
          useEndAsStart: false
        }

        interpolateColors(3, mockColorScale, options)

        // For 3 items from 20 to 80: interval = 20
        // Points should be: 20, 40, 60
        expect(mockColorScale).toHaveBeenNthCalledWith(1, 20)
        expect(mockColorScale).toHaveBeenNthCalledWith(2, 40)
        expect(mockColorScale).toHaveBeenNthCalledWith(3, 60)
      })
    })

    describe('Edge Cases', () => {
      it('handles single data point', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: false
        }

        const result = interpolateColors(1, mockColorScale, options)
        
        expect(result).toHaveLength(1)
        expect(mockColorScale).toHaveBeenCalledWith(0)
        expect(result).toEqual(['color-0'])
      })

      it('handles zero data points', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: false
        }

        const result = interpolateColors(0, mockColorScale, options)
        
        expect(result).toHaveLength(0)
        expect(mockColorScale).not.toHaveBeenCalled()
      })

      it('handles negative color ranges', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: -50,
          colorEnd: 50,
          useEndAsStart: false
        }

        interpolateColors(5, mockColorScale, options)

        // For 5 items from -50 to 50: interval = 20
        // Points should be: -50, -30, -10, 10, 30
        expect(mockColorScale).toHaveBeenNthCalledWith(1, -50)
        expect(mockColorScale).toHaveBeenNthCalledWith(2, -30)
        expect(mockColorScale).toHaveBeenNthCalledWith(3, -10)
        expect(mockColorScale).toHaveBeenNthCalledWith(4, 10)
        expect(mockColorScale).toHaveBeenNthCalledWith(5, 30)
      })

      it('handles reverse ranges (start > end) with useEndAsStart false', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 100,
          colorEnd: 0,
          useEndAsStart: false
        }

        interpolateColors(3, mockColorScale, options)

        // For 3 items from 100 to 0: interval = -33.333...
        // Points should be: 100, 66.666..., 33.333...
        expect(mockColorScale).toHaveBeenNthCalledWith(1, 100)
        // Use approximate matching for floating point numbers
        const secondCall = mockColorScale.mock.calls[1][0]
        const thirdCall = mockColorScale.mock.calls[2][0]
        expect(Math.abs(secondCall - 66.66666666666667)).toBeLessThan(0.0001)
        expect(Math.abs(thirdCall - 33.333333333333336)).toBeLessThan(0.0001)
      })

      it('handles same start and end values', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 50,
          colorEnd: 50,
          useEndAsStart: false
        }

        interpolateColors(3, mockColorScale, options)

        // All points should be the same
        expect(mockColorScale).toHaveBeenNthCalledWith(1, 50)
        expect(mockColorScale).toHaveBeenNthCalledWith(2, 50)
        expect(mockColorScale).toHaveBeenNthCalledWith(3, 50)
      })
    })

    describe('Precision and Mathematics', () => {
      it('calculates correct intervals for various data lengths', () => {
        const testCases = [
          { dataLength: 2, start: 0, end: 10, expectedInterval: 5 },
          { dataLength: 10, start: 0, end: 100, expectedInterval: 10 },
          { dataLength: 3, start: 10, end: 40, expectedInterval: 10 }
        ]

        testCases.forEach(({ dataLength, start, end, expectedInterval }) => {
          mockColorScale.mockClear()
          
          const options: ColorsInterpolateOptions = {
            colorStart: start,
            colorEnd: end,
            useEndAsStart: false
          }

          interpolateColors(dataLength, mockColorScale, options)

          // Check that the interval between calls is correct
          for (let i = 1; i < dataLength; i++) {
            const currentCall = mockColorScale.mock.calls[i][0]
            const previousCall = mockColorScale.mock.calls[i - 1][0]
            const actualInterval = currentCall - previousCall
            
            expect(Math.abs(actualInterval - expectedInterval)).toBeLessThan(0.0001)
          }
        })
      })

      it('maintains precision with floating point arithmetic', () => {
        const options: ColorsInterpolateOptions = {
          colorStart: 0.1,
          colorEnd: 0.9,
          useEndAsStart: false
        }

        interpolateColors(4, mockColorScale, options)

        // For 4 items from 0.1 to 0.9: interval = 0.2
        // Use approximate matching for floating point precision
        expect(mockColorScale).toHaveBeenNthCalledWith(1, 0.1)
        
        const calls = mockColorScale.mock.calls.map(call => call[0])
        expect(Math.abs(calls[1] - 0.3)).toBeLessThan(0.0001)
        expect(Math.abs(calls[2] - 0.5)).toBeLessThan(0.0001)
        expect(Math.abs(calls[3] - 0.7)).toBeLessThan(0.0001)
      })
    })

    describe('Color Scale Integration', () => {
      it('works with different color scale functions', () => {
        const linearScale = (point: number) => `linear-${point}`
        const logarithmicScale = (point: number) => `log-${Math.log(point + 1)}`
        
        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: false
        }

        const linearResult = interpolateColors(3, linearScale, options)
        const logResult = interpolateColors(3, logarithmicScale, options)

        expect(linearResult).toHaveLength(3)
        expect(linearResult[0]).toBe('linear-0')
        expect(linearResult[1]).toMatch(/linear-33\.333333333333\d+/)
        expect(linearResult[2]).toMatch(/linear-66\.666666666666\d+/)
        
        expect(logResult).toHaveLength(3)
        expect(logResult[0]).toBe('log-0')
        expect(logResult[1]).toMatch(/log-3\.5\d+/)
        expect(logResult[2]).toMatch(/log-4\.2\d+/)
      })

      it('preserves color scale return values exactly', () => {
        const complexColorScale = (point: number) => ({
          r: point,
          g: point * 2,
          b: point * 3,
          toString: () => `rgb(${point}, ${point * 2}, ${point * 3})`
        })

        const options: ColorsInterpolateOptions = {
          colorStart: 10,
          colorEnd: 30,
          useEndAsStart: false
        }

        const result = interpolateColors(2, complexColorScale, options)
        
        expect(result).toHaveLength(2)
        expect(result[0].r).toBe(10)
        expect(result[0].g).toBe(20)
        expect(result[0].b).toBe(30)
        expect(result[1].r).toBe(20)
        expect(result[1].g).toBe(40)
        expect(result[1].b).toBe(60)
      })
    })

    describe('Real-world Usage Patterns', () => {
      it('works with typical color interpolation scenario', () => {
        // Simulate a real d3 color scale
        const d3Scale = (t: number) => {
          const normalized = t / 100
          const r = Math.floor(255 * (1 - normalized))
          const g = Math.floor(255 * normalized)
          const b = 100
          return `rgb(${r}, ${g}, ${b})`
        }

        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 100,
          useEndAsStart: false
        }

        const result = interpolateColors(5, d3Scale, options)
        
        expect(result).toHaveLength(5)
        expect(result[0]).toBe('rgb(255, 0, 100)')    // t=0
        expect(result[1]).toBe('rgb(204, 51, 100)')   // t=20
        expect(result[2]).toBe('rgb(153, 102, 100)')  // t=40
        expect(result[3]).toBe('rgb(102, 153, 100)')  // t=60
        // Last one might vary due to floating point: could be 50 or 51
        expect(result[4]).toMatch(/rgb\((50|51), 204, 100\)/)
      })

      it('works with waffle chart color distribution', () => {
        // Simulate a typical waffle chart color distribution
        const waffleColors = ['#ff0000', '#ff8800', '#ffff00', '#88ff00', '#00ff00']
        const colorScale = (point: number) => {
          const index = Math.floor(point / 20) % waffleColors.length
          return waffleColors[index]
        }

        const options: ColorsInterpolateOptions = {
          colorStart: 0,
          colorEnd: 80,
          useEndAsStart: false
        }

        const result = interpolateColors(5, colorScale, options)
        
        expect(result).toEqual([
          '#ff0000',  // point=0, index=0
          '#ff0000',  // point=16, index=0 
          '#ff8800',  // point=32, index=1
          '#ffff00',  // point=48, index=2
          '#88ff00'   // point=64, index=3
        ])
      })
    })
  })
})