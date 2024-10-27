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
                // primary: '#008491',
                // primaryHovered: '#00747e',
                // primaryLight: 'rgba(17, 251, 196, 0.06)',
                // alert: '#b31f1f',
                // text: '#2a2d31',
                // grayTitle: '#4f4e4e',
                // menuBackground: '#0084910d',
                // yellow: '#dab909',
                // red: '#e63434',
                // redLight: '#ffe8e8',
                // redBorder: '#e8d5d5',
                // redLightText: '#995a5a',
                green: '#808e64',
                patched: '#5a9d09',
                partiallyPatched: '#ffc107',
                notPatched: '#bf1313',
                severityCritical: '#000',
                severityHigh: '#bf1313',
                severityMedium: '#ffc107',
                severityLow: '#5a9d09',
                severityNone: '#09889d',

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
                    from: { height: 0 },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: 0 }
                },
                'collapsible-down': {
                    from: { height: 0 },
                    to: { height: 'var(--radix-collapsible-content-height)' }
                },
                'collapsible-up': {
                    from: { height: 'var(--radix-collapsible-content-height)' },
                    to: { height: 0 }
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
    plugins: [animate]
};
