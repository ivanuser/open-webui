import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		sveltekit(),
		viteStaticCopy({
			targets: [
				{
					src: 'node_modules/onnxruntime-web/dist/*.jsep.*',

					dest: 'wasm'
				}
			]
		})
	],
	server: {
		host: true, // Listen on all network interfaces
		allowedHosts: [
			'localhost',
			'127.0.0.1',
			'openweb.honercloud.com',
			'.honercloud.com' // This allows any subdomain of honercloud.com
		],
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/ollama': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/openai': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/rag': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/images': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/audio': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/utils': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			}
		}
	},
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'dev-build')
	},
	build: {
		sourcemap: true
	},
	worker: {
		format: 'es'
	},
	esbuild: {
		pure: process.env.ENV === 'dev' ? [] : ['console.log', 'console.debug']
	}
});
