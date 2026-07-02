import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const allowedHosts = env.VITE_ALLOWED_HOSTS?.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const port = Number.parseInt(env.VITE_PORT ?? '', 10);

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			host: '127.0.0.1',
			port: Number.isNaN(port) ? undefined : port,
			strictPort: true,
			allowedHosts
		}
	};
});
