/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./setup-tests.js'],
        deps: {
            inline: ['vitest-canvas-mock'],
        },
        // For this config, check https://github.com/vitest-dev/vitest/issues/740
        environmentOptions: {
            jsdom: {
                resources: 'usable',
            },
        },
    }
})
