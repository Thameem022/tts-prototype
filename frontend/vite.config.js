import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			'/ws/tts': {
				target: 'ws://localhost:8000',
				ws: true,
				changeOrigin: true
			}
		}
	}
})
