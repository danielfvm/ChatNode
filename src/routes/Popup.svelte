<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let visible = false;
	export let openOnStart = true;

	setTimeout(() => (visible = openOnStart));

	const dispatch = createEventDispatcher();

	function close() {
		setTimeout(() => {
			dispatch('close');
		}, 200);

		visible = false;
	}

	onMount(() => {
		const onKeydown = (event) => {
			if (event.key === 'Escape' && visible) close();
		};
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

{#if visible}
	<section transition:fade={{ duration: 200 }}>
		<button class="backdrop" aria-label="Close dialog" on:click={close}></button>
		<div class="box" role="dialog" aria-modal="true" aria-label="Dialog" transition:fly={{ y: 200, duration: 200 }}>
			<slot />
		</div>
	</section>
{/if}

<style>
	section {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.68);
		backdrop-filter: blur(3px);
		z-index: 4;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: transparent;
		cursor: default;
	}

	.box {
		position: fixed;
		top: 50%;
		left: 50%;
		width: max-content;
		max-width: calc(100vw - 32px);
		max-height: calc(100dvh - 32px);
		overflow: auto;
		transform: translate(-50%, -50%);

		border: 1px solid #cbd5c3;
		background: #f7f6ec;
		color: #203c2e;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 24px 80px #193b2d40;
	}
</style>
