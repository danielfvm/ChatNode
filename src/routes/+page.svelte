<script>
	import { onMount } from 'svelte';
	import { Chat, MessageData, tryParse } from './connection';

	import Header from './Header.svelte';
	import Info from './Info.svelte';
	import Message from './Message.svelte';
	import Chatbox from './Chatbox.svelte';
	import Profile from './Profile.svelte';

	import defaultProfilePicture from '#lib/images/profile.png';
	import Userlist from './Userlist.svelte';

	let profile = {
		picture: defaultProfilePicture,
		name: 'Guest' + Math.random().toString().substring(2, 6),
		pronouns: 'they/them',
		bio: 'No bio yet'
	};

	let openProfile = null;

	let chats = [];
	let selectedChat;
	let chatscroll;
	let chatboxNode;

	let popupMessage = '';
	let editingChatName = false;
	let chatNameDraft = '';

	let profiles = [];

	function parseLink(link) {
		try {
			const result = atob(link)
				.split(':')
				.filter((x) => x.trim().length > 0);

			return {
				chat: result.shift(),
				peers: result
			};
		} catch (e) {
			return null;
		}
	}

	function getInvite() {
		const search = window.location.search.replace('?', '').split('&');

		for (const x of search) {
			const data = x.split('=');
			const tag = data.shift();

			if (tag != 'chat' || !data) {
				return;
			}

			return parseLink(data.join('='));
		}

		return null;
	}

	function sendMessage(text, attachments = []) {
		selectedChat.writeMessage(new MessageData(text, { profile }, attachments));
	}

	function showProfilePic(message) {
		const prev = selectedChat.messages[selectedChat.messages.indexOf(message) - 1];

		if (!prev) return true;

		return message.profile !== prev.profile || message.time.getMinutes() !== prev.time.getMinutes();
	}

	function rebuildChat() {
		selectedChat = selectedChat;
	}

	function createChat(chat) {
		if (chat.name.length <= 0) return;

		const idx = chats.findIndex((x) => x.name == chat.name);
		if (idx != -1) {
			closeChat(chats[idx]);
		}

		chat.onUserChange = (_user) => {
			if (chat == selectedChat) {
				rebuildChat();
				chat.refreshTitle();
			}
			localStorage.setItem('chats', JSON.stringify(chats.map((x) => x.getLink())));
		};

		chat.onMessage = (_message) => {
			if (chat != selectedChat) return;

			selectedChat.messages = selectedChat.messages;

			if (chatscroll)
				console.log(chatscroll.scrollHeight, chatscroll.scrollTop + chatscroll.clientHeight);
			if (
				chatscroll &&
				(chatscroll.scrollHeight < chatscroll.scrollTop + chatscroll.clientHeight * 1.1 ||
					_message.profile == profile)
			)
				setTimeout(() => {
					chatscroll.scrollBy({
						left: 0,
						top: document.body.scrollHeight,
						behavior: 'smooth'
					});
				}, 50);
		};

		chats = [...chats, chat];

		return chat;
	}

	function openChat(chat) {
		if (chat) {
			selectedChat = chat;
			selectedChat.refreshTitle();
			setTimeout(() => {
				if (chatscroll) chatscroll.scrollTop = chatscroll.scrollHeight;
			}, 0);
		}
	}

	function beginRename() {
		if (!selectedChat) return;
		chatNameDraft = selectedChat.name;
		editingChatName = true;
		setTimeout(() => document.getElementById('chat-name-input')?.select(), 0);
	}

	function saveChatName() {
		if (!selectedChat) return;
		selectedChat.rename(chatNameDraft);
		editingChatName = false;
	}

	async function copyInvite() {
		if (!selectedChat) return;
		selectedChat.refreshTitle();
		try {
			await navigator.clipboard.writeText(window.location.href);
			popupMessage = 'Invite link copied to clipboard.';
		} catch (error) {
			popupMessage = 'Could not copy the invite link. Check clipboard permissions and try again.';
		}
	}

	function closeChat(chat) {
		// cannot remove something that does not exist
		if (chats.length <= 0) return;

		// search idx in list and remove it
		let idx = chats.indexOf(selectedChat);

		chats = chats.filter((c) => {
			if (c == chat) chat.close();
			return c != chat;
		});
		console.log('CLOSE', chats);

		// update local storage for future reloading
		localStorage.setItem('chats', JSON.stringify(chats.map((x) => x.getLink())));

		// select new chat
		if (!chats.includes(selectedChat) && chats.length > 0 && idx != -1) {
			selectedChat = idx >= chats.length ? chats[chats.length - 1] : chats[idx];
			selectedChat.refreshTitle();
		} else {
			selectedChat = null;
			window.history.replaceState(null, 'Title', '?');
		}
	}

	function loadOldChat() {
		const links = tryParse(localStorage.getItem('chats')) || [];

		for (const link of links) {
			const res = parseLink(link);
			if (!res) continue;
			createChat(Chat.joinChat(profile, res.chat, res.peers));
		}
	}

	function onMessageEdit(msg) {
		if (msg.program) {
			chatboxNode.setText(msg.text);
			chatboxNode.setEndOfContenteditable();
			chatboxNode.focus();

			chatboxNode.setProgram(msg.program.trim());
			chatboxNode.openMenu(true);
			setTimeout(() => chatboxNode.changeMenuTab(3), 10);
		} else {
			chatboxNode.setText(msg.data);
			chatboxNode.setEndOfContenteditable();
			chatboxNode.focus();
		}
	}

	$: {
		profiles = [{ id: 'local', profile }];

		if (selectedChat) {
			profiles.push(
				...selectedChat.users
					.filter((user) => user.profile.loaded)
					.map((user) => ({ id: user.conn.peer, profile: user.profile }))
			);
		}
	};

	onMount(() => {
		window.scrollTo(0, document.body.scrollHeight);

		// load profile from local storage
		localStorage.getItem('profile') && (profile = JSON.parse(localStorage.getItem('profile')));

		// get invite from url
		const invite = getInvite();

		// we first load the old chats
		loadOldChat();

		// and update the old chat if we have a new invite to same chat
		if (invite) {
			createChat(Chat.joinChat(profile, invite.chat, invite.peers));
		}

		// open last chat in list
		openChat(chats[chats.length - 1]);
	});
</script>

<svelte:head>
	<title>Chat Node</title>
	<meta name="description" content="Svelte demo app" />
	<meta name="author" content="DeanCode" />
	<meta name="description" content="A hackable decentralized chat platform" />
</svelte:head>

<div class="chat-app">
	<Header
		on:closeChat={(e) => closeChat(e.detail)}
		on:openChat={(e) => openChat(e.detail)}
		on:createChat={() => openChat(createChat(Chat.createChat(profile)))}
		on:profile={(e) => (openProfile = e.detail)}
		{profile}
		{chats}
		{selectedChat}
	/>

	<main class="workspace">
		{#if selectedChat}
			<div class="channel-header">
				<div class="channel-title">
					<span class="channel-hash">#</span>
					{#if editingChatName}
						<input
							id="chat-name-input"
							bind:value={chatNameDraft}
							maxlength="40"
							aria-label="Rename chat"
							on:keydown={(event) => {
								if (event.key === 'Enter') saveChatName();
								if (event.key === 'Escape') editingChatName = false;
							}}
							on:blur={saveChatName}
						/>
					{:else}
						<h1>{selectedChat.name}</h1>
					{/if}
					<button class="toolbar-icon" aria-label="Rename chat" title="Rename chat" on:click={beginRename}>
						<i class="bi bi-pencil" aria-hidden="true"></i>
					</button>
				</div>
				<div class="toolbar-actions">
					<div class="presence" aria-label={`${profiles.length} members in this chat`} title="Members in this chat">
						<span class="presence-avatars" aria-hidden="true">
							{#each profiles.slice(0, 3) as member (member.id)}
								<img src={member.profile.picture} alt="" />
							{/each}
						</span>
						<span class="presence-count">{profiles.length} here</span>
					</div>
					<button class="toolbar-icon invite-button" on:click={copyInvite} title="Copy invite link">
						<i class="bi bi-person-plus-fill" aria-hidden="true"></i>
						<span>Invite</span>
					</button>
				</div>
			</div>

			<div class="workspace-body">
				<section class="conversation" aria-label={`Chat ${selectedChat.name}`}>
					{#if selectedChat.messages.length === 0}
						<div class="welcome-note">
							<div class="welcome-hash">#</div>
							<h2>Welcome to #{selectedChat.name}!</h2>
							<p>This is the beginning of this conversation.</p>
						</div>
					{/if}
					<div class="messages" bind:this={chatscroll}>
						{#each selectedChat.messages as message}
							<Message
								{message}
								showProfile={showProfilePic(message)}
								owner={message.profile == profile}
								on:profile={(e) => (openProfile = e.detail)}
								on:edit={() => onMessageEdit(message)}
							/>
						{/each}
					</div>
					<Chatbox
						editing={!openProfile}
						bind:this={chatboxNode}
						on:message={(e) => sendMessage(e.detail.message, e.detail.attachments)}
						on:error={(e) => (popupMessage = e.detail)}
					/>
				</section>
				<Userlist profiles={profiles} on:profile={(e) => (openProfile = e.detail)} />
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon"><i class="bi bi-chat-square-dots-fill" aria-hidden="true"></i></div>
				<h1>Your conversations, together.</h1>
				<p>Create a chat, share its invite link, and start talking.</p>
				<button on:click={() => openChat(createChat(Chat.createChat(profile)))}>
					<i class="bi bi-plus-lg" aria-hidden="true"></i> Create a chat
				</button>
			</div>
		{/if}
	</main>
</div>

<Info bind:message={popupMessage} />

{#if openProfile}
	<Profile
		bind:profile={openProfile}
		editable={profile == openProfile}
		on:close={() => (openProfile = null)}
		on:updateProfile={(e) => {
			profile = e.detail;
			selectedChat?.updateProfile(profile);
			rebuildChat();
		}}
	/>
{/if}

<style>
	.chat-app {
		display: flex;
		width: 100%;
		height: 100dvh;
		overflow: hidden;
		background: var(--paper);
		color: var(--ink);
	}

	.workspace {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		height: 100%;
		background: var(--paper);
	}

	.channel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 62px;
		flex: 0 0 62px;
		padding: 0 20px;
		border-bottom: 1px solid #d5dacb;
		background: rgba(251, 250, 242, 0.92);
		box-shadow: 0 2px 8px #344c3510;
	}

	.channel-title {
		display: flex;
		align-items: center;
		min-width: 0;
		gap: 10px;
	}

	.channel-hash {
		color: var(--moss);
		font-size: 24px;
		font-weight: 400;
	}

	.channel-title h1 {
		overflow: hidden;
		margin: 0;
		color: var(--ink);
		font-size: 15px;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.channel-title input {
		width: min(320px, 42vw);
		padding: 5px 8px;
		border: 1px solid #7d9a69;
		border-radius: 5px;
		outline: none;
		background: var(--paper-raised);
		color: var(--ink);
	}

	.toolbar-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--ink-muted);
		white-space: nowrap;
		flex-shrink: 0;
		cursor: pointer;
	}

	.toolbar-icon:hover {
		background: var(--moss-light);
		color: var(--forest-deep);
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}

	.presence {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 32px;
		padding: 0 9px;
		border: 1px solid #d6ddcd;
		border-radius: 999px;
		background: #f1f3e8;
		color: #526553;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}

	.presence-avatars {
		display: inline-flex;
		align-items: center;
		padding-left: 3px;
	}

	.presence-avatars img {
		width: 20px;
		height: 20px;
		margin-left: -4px;
		border: 2px solid #f1f3e8;
		border-radius: 50%;
		background: #d5dfcc;
		object-fit: cover;
	}

	.invite-button {
		color: var(--forest);
		font-size: 13px;
	}

	.invite-button:hover {
		background: #e4ecd9;
		color: var(--forest-deep);
	}

	.workspace-body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.conversation {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.messages {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 18px 0 14px;
		scrollbar-color: #b3c0aa transparent;
	}

	.welcome-note {
		padding: 0 24px 18px;
		color: var(--ink-muted);
	}

	.welcome-hash {
		display: grid;
		width: 60px;
		height: 60px;
		margin-bottom: 14px;
		place-items: center;
		border-radius: 50%;
		background: #e2e8d9;
		color: var(--moss);
		font-size: 38px;
		font-weight: 300;
	}

	.welcome-note h2 {
		margin: 0 0 6px;
		color: var(--ink);
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.welcome-note p {
		margin: 0;
		font-size: 14px;
	}

	.empty-state {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 32px;
		text-align: center;
	}

	.empty-icon {
		display: grid;
		width: 82px;
		height: 82px;
		margin-bottom: 24px;
		place-items: center;
		border: 1px solid #cbd6c2;
		border-radius: 24px;
		background: #e6eadc;
		color: var(--moss);
		font-size: 32px;
		box-shadow: 0 16px 40px #41533c20;
	}

	.empty-state h1 {
		margin: 0 0 8px;
		color: var(--ink);
		font-size: clamp(24px, 3vw, 36px);
		letter-spacing: -0.03em;
	}

	.empty-state p {
		margin: 0 0 22px;
		color: var(--ink-muted);
		font-size: 15px;
	}

	.empty-state button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 11px 16px;
		border: 0;
		border-radius: 6px;
		background: var(--forest);
		color: #fbfaf2;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.empty-state button:hover {
		background: #315d43;
	}

	@media (max-width: 720px) {
		.channel-header {
			height: 54px;
			flex-basis: 54px;
			padding: 0 12px;
		}

		.toolbar-actions {
			gap: 5px;
		}

		.presence {
			gap: 4px;
			padding: 0 6px;
			font-size: 10px;
		}

		.presence-avatars img {
			width: 18px;
			height: 18px;
		}

		.welcome-note {
			padding-right: 14px;
			padding-left: 14px;
		}

		.welcome-note h2 {
			font-size: 20px;
		}
	}
</style>
