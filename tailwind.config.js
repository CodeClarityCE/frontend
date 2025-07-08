import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    safelist: ['dark'],

    content: [
        './index.html',
        './pages/**/*.{ts,tsx,vue}',
        './components/**/*.{ts,tsx,vue}',
        './app/**/*.{ts,tsx,vue}',
        './src/**/*.{ts,tsx,vue}'
    ],

    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			// Primary theme colors
    			'theme-primary': '#1dce79',
    			'theme-primary-dark': '#18b56b',
    			'theme-primary-light': '#2ee085',
    			'theme-black': '#000000',
    			'theme-gray': '#1a1a1a',
    			'theme-gray-light': '#333333',
    			
    			green: '#1dce79',
    			patched: '#5a9d09',
    			partiallyPatched: '#ffc107',
    			notPatched: '#bf1313',
    			severityCritical: '#000',
    			severityHigh: '#bf1313',
    			severityMedium: '#ffc107',
    			severityLow: '#5a9d09',
    			severityNone: '#09889d',
				severityCriticalLight: '#4b4242',
				severityHighLight: '#ae5e5e',
				severityMediumLight: '#cca067',
				severityLowLight: '#9dae5e',
				severityNoneLight: '#397680',
				// Transparent severity colors for progress bars
				severityCriticalBg: 'rgba(0, 0, 0, 0.1)',
				severityHighBg: 'rgba(191, 19, 19, 0.1)',
				severityMediumBg: 'rgba(255, 193, 7, 0.1)',
				severityLowBg: 'rgba(90, 157, 9, 0.1)',
				severityNoneBg: 'rgba(9, 136, 157, 0.1)',
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			xl: 'calc(var(--radius) + 4px)',
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--reka-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--reka-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'collapsible-down': {
    				from: {
    					height: 0
    				},
    				to: {
    					height: 'var(--radix-collapsible-content-height)'
    				}
    			},
    			'collapsible-up': {
    				from: {
    					height: 'var(--radix-collapsible-content-height)'
    				},
    				to: {
    					height: 0
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'collapsible-down': 'collapsible-down 0.2s ease-in-out',
    			'collapsible-up': 'collapsible-up 0.2s ease-in-out'
    		}
    	}
    },
    plugins: [animate, require("tailwindcss-animate")]
};
