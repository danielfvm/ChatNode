<script>
	import { createEventDispatcher } from 'svelte';

	export let chats;
	export let selectedChat;

	const dispatch = createEventDispatcher();
</script>

<header>
	{#each chats as chat}
		<div on:click={() => dispatch("openChat", chat)} class="chat {chat == selectedChat ? 'select' : ''}">
			{chat.name}
			<i on:click={() => dispatch("closeChat", chat)} class="bi bi-x-circle-fill" />
		</div>
	{/each}
	<div class="chat" on:click={() => dispatch("createChat")}>
		<i class="bi bi-plus-circle-fill" />
	</div>
</header>

<style>
	.chat {
		display: inline;
		padding: 10px;
		margin-right: 5px;
		background: rgba(0, 0, 0, 0.25);
		border-radius: 10px;
		box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.25);
		font-weight: bolder;
		font-size: 20px;
		line-height: 40px;
		user-select: none;
		cursor: pointer;
		margin-top: 5px;
		color: rgba(255, 255, 255, 0.2);
		transition: background 0.3s;
	}

	.select {
		color: rgba(255, 255, 255, 0.7);
		background: rgba(0, 0, 0, 0.5);
	}

	.chat:hover {
		background: rgba(0, 0, 0, 0.5);
	}

	i {
		font-weight: bolder;
	}

	i:hover {
		cursor: pointer;
		color: #ff6080 !important;
	}

	header {
		position: sticky;
		top: 0;
		color: white;
		height: 50px;
		width: 100%;
		padding: 4px;
		z-index: 1;

		padding: 5px;
		float: left;
		height: 44px;
		scroll-direction: horizontal;
		overflow: hidden;
		white-space: nowrap;
		scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
		scrollbar-width: 3px;
	}
</style>
