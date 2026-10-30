<script>
	import { createEventDispatcher } from 'svelte';

	export let chats = [];
	export let selectedChat;
	export let profile;

	const dispatch = createEventDispatcher();
</script>

<aside class="sidebar">
	<div class="brand">
		<div class="brand-mark"><i class="bi bi-chat-dots-fill" aria-hidden="true"></i></div>
		<div>
			<strong>ChatNode</strong>
			<span>Direct messages</span>
		</div>
	</div>

	<div class="section-heading">
		<span>CONVERSATIONS</span>
		<button class="icon-button add-chat" aria-label="Create a chat" title="Create a chat" on:click={() => dispatch('createChat')}>
			<i class="bi bi-plus-lg" aria-hidden="true"></i>
		</button>
	</div>

	<nav class="chat-list" aria-label="Chats">
		{#each chats as chat (chat.peerId || chat.name)}
			<div class:active={chat === selectedChat} class="chat-item">
				<button class="chat-select" title={chat.name} on:click={() => dispatch('openChat', chat)}>
					<span class="hash">#</span>
					<span class="chat-mobile-icon">{chat.name.slice(0, 1).toUpperCase()}</span>
					<span class="chat-name">{chat.name}</span>
				</button>
				<button
					class="icon-button close-chat"
					aria-label={`Close ${chat.name}`}
					title="Close chat"
					on:click={() => dispatch('closeChat', chat)}
				>
					<i class="bi bi-x-lg" aria-hidden="true"></i>
				</button>
			</div>
		{/each}
		{#if chats.length === 0}
			<p class="empty-list">Your chats will appear here.</p>
		{/if}
	</nav>

	<div class="account">
		<button class="account-button" on:click={() => dispatch('profile', profile)} aria-label="Open your profile">
			<span class="avatar">
				<img src={profile.picture} alt="" />
				<span class="online-dot"></span>
			</span>
			<span class="account-copy">
				<strong>{profile.name}</strong>
				<small>{profile.pronouns || 'Your profile'}</small>
			</span>
			<i class="bi bi-gear-fill account-settings" aria-hidden="true"></i>
		</button>
	</div>
</aside>

<style>
	.sidebar {
		display: flex;
		flex: 0 0 252px;
		flex-direction: column;
		min-width: 0;
		height: 100dvh;
		background: #214533;
		color: #f3f1e4;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 72px;
		padding: 0 18px;
		border-bottom: 1px solid #193b2d;
		box-shadow: 0 1px 4px #102d2080;
	}

	.brand-mark {
		display: grid;
		width: 38px;
		height: 38px;
		place-items: center;
		border-radius: 12px;
		background: linear-gradient(145deg, #b2c68d, #6e9560);
		color: #193b2d;
		font-size: 19px;
		box-shadow: 0 5px 16px #132f2355;
	}

	.brand strong,
	.brand span,
	.account-copy strong,
	.account-copy small {
		display: block;
	}

	.brand strong {
		color: #fbfaf2;
		font-size: 15px;
		letter-spacing: 0.02em;
	}

	.brand span {
		margin-top: 3px;
		color: #b7c8b3;
		font-size: 11px;
	}

	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 25px 12px 8px;
		padding: 0 4px;
		color: #a9bea7;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.09em;
	}

	.icon-button {
		display: grid;
		width: 26px;
		height: 26px;
		place-items: center;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: #b7c8b3;
		cursor: pointer;
	}

	.icon-button:hover {
		background: #315b43;
		color: #fbfaf2;
	}

	.add-chat {
		font-size: 16px;
	}

	.chat-list {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 3px;
		overflow-y: auto;
		padding: 0 8px 12px;
	}

	.chat-item {
		display: flex;
		align-items: center;
		min-height: 40px;
		border-radius: 6px;
		color: #b7c8b3;
	}

	.chat-item:hover,
	.chat-item.active {
		background: #2b523d;
		color: #fbfaf2;
	}

	.chat-item.active {
		background: #356248;
	}

	.chat-select {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
		padding: 8px 10px;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.hash {
		color: #9db29b;
		font-size: 20px;
		font-weight: 500;
		line-height: 16px;
	}

	.chat-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
		font-weight: 500;
	}

	.chat-mobile-icon {
		display: none;
	}

	.close-chat {
		margin-right: 5px;
		opacity: 0;
	}

	.chat-item:hover .close-chat,
	.chat-item.active .close-chat {
		opacity: 1;
	}

	.empty-list {
		padding: 8px 10px;
		color: #a9bea7;
		font-size: 12px;
	}

	.account {
		padding: 10px;
		background: #193b2d;
	}

	.account-button {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 10px;
		padding: 7px;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: #fbfaf2;
		text-align: left;
		cursor: pointer;
	}

	.account-button:hover {
		background: #2b523d;
	}

	.avatar {
		position: relative;
		display: block;
		width: 36px;
		height: 36px;
		flex: 0 0 36px;
		border: 2px solid #a4bd82;
		border-radius: 50%;
		background: #315b43;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		object-fit: cover;
	}

	.online-dot {
		position: absolute;
		right: -2px;
		bottom: -2px;
		width: 11px;
		height: 11px;
		border: 2px solid #193b2d;
		border-radius: 50%;
		background: #23a559;
	}

	.account-copy {
		flex: 1;
		min-width: 0;
	}

	.account-copy strong {
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
	}

	.account-copy small {
		margin-top: 2px;
		color: #b7c8b3;
		font-size: 11px;
	}

	.account-settings {
		padding: 6px;
		color: #b7c8b3;
		font-size: 14px;
	}

	@media (max-width: 720px) {
		.sidebar {
			flex-basis: 68px;
		}

		.brand {
			justify-content: center;
			padding: 0 8px;
		}

		.brand > div:last-child,
		.section-heading span,
		.chat-name,
		.close-chat,
		.empty-list,
		.account-copy,
		.account-settings {
			display: none;
		}

		.section-heading {
			justify-content: center;
			margin: 14px 0 8px;
		}

		.chat-list {
			padding: 0 8px 10px;
		}

		.chat-item {
			justify-content: center;
		}

		.chat-select {
			justify-content: center;
			padding: 10px 0;
		}

		.hash {
			display: none;
		}

		.chat-mobile-icon {
			display: grid;
			width: 34px;
			height: 34px;
			place-items: center;
			border-radius: 50%;
			background: #356248;
			color: #f3f1e4;
			font-size: 15px;
			font-weight: 650;
			text-transform: uppercase;
		}

		.chat-item.active .chat-mobile-icon {
			background: #789a62;
			color: #193b2d;
		}

		.account {
			padding: 8px 6px;
		}

		.account-button {
			justify-content: center;
			padding: 5px 0;
		}
	}
</style>
