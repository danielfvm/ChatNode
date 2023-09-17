<script>
	import { createEventDispatcher } from 'svelte';

	export let profile;
	export let chats;
	export let selectedChat;

	const dispatch = createEventDispatcher();
</script>

<header>
	<div class="start">
		{#each chats as chat}
			<div on:click={() => dispatch("openChat", chat)} class="chat {chat == selectedChat ? 'select' : ''}">
				{chat.name}
				<i on:click={() => dispatch("closeChat", chat)} class="bi bi-x-circle-fill" />
			</div>
		{/each}
		<div class="chat" on:click={() => dispatch("createChat")}>
			<i class="bi bi-plus-circle-fill" />
		</div>
	</div>
	<div class="end">
		<div class="profile" on:click={() => dispatch('profile', profile)}>
			<div class="name">{profile.name}</div>
			<div class="image-cropper">
				<img
					draggable="false"
					oncontextmenu="return false;"
					src={profile.picture}
					alt="Profile picture"
				/>
			</div>
		</div>
	</div>
</header>

<style>
	.start {
		padding: 5px;
		float: left;
		width: calc(100vw - 300px);
		height: 44px;
		scroll-direction: horizontal;
		overflow: hidden;
		white-space: nowrap;
		scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
		scrollbar-width: 3px;
	}

	.end {
		float: right;
	}

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

	.image-cropper {
		width: 40px;
		height: 40px;
		overflow: hidden;
		border-radius: 50%;
		user-select: none;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: auto;
	}

	header {
		position: sticky;
		top: 0;
		color: white;
		height: 50px;
		width: 100%;
		padding: 4px;

		/*background: #352f44;
		box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25);*/
	}

	a {
		color: white;
	}

	.name {
		font-weight: bolder;
		float: left;
		line-height: 40px;
		font-size: 18px;
		padding-left: 10px;
		margin: 0 12px 0 12px;
	}

	.profile {
		background: rgba(0, 0, 0, 0.25);
		border-radius: 40px;
		margin-right: 10px;
		height: 40px;
		margin-top: 4px;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
		color: lightgray;
		max-width: 280px;
		scroll-direction: horizontal;
		white-space: nowrap;
		overflow: hidden;
		scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
		scrollbar-width: 3px;

		top: 0;
	}

	.profile:hover {
		cursor: pointer;
		background: rgba(0, 0, 0, 0.5);
	}

	.hover:hover {
		cursor: pointer;
		color: #00a5ff !important;
	}
</style>
