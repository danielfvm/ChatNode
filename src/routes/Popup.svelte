<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	let parent = null;
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

	function click(evt) {
		if (evt.target == parent) close();
	}

	onMount(() => {
		document.addEventListener('keydown', (ev) => {
			if (ev.key == 'Escape') close();			
		});
	})
</script>

{#if visible}
	<section bind:this={parent} on:click={click} transition:fade={{ duration: 200 }}>
		<div class="box" transition:fly={{ y: 200, duration: 200 }}>
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
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(3px);
		z-index: 2;
	}

	.box {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		background: #352f44;
		color: white;
		border-radius: 10px;
		padding: 20px;
	}
</style>
