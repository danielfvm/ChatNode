import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			paths: {
				base: dev ? '' : process.env.BASE_PATH
			}
		})
	]
});
