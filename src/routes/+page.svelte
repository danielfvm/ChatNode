<script>
	import { onMount } from 'svelte';
	import { Chat, MessageData, tryParse } from './connection';

	import Header from './Header.svelte';
	import Info from './Info.svelte';
	import Message from './Message.svelte';
	import Chatbox from './Chatbox.svelte';
	import Profile from './Profile.svelte';

	import defaultProfilePicture from '$lib/images/profile.png';

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

	let popupMessage = '';

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

	function sendMessage(text) {
		selectedChat.writeMessage(new MessageData(text, { profile: profile }));
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

		chat.onUserJoined = (_user) => {
			if (chat != selectedChat) return;
			rebuildChat();
			chat.refreshTitle();
			localStorage.setItem('chats', JSON.stringify(chats.map((x) => x.getLink())));
		};

		chat.onMessage = (_message) => {
			if (chat != selectedChat) return;
			selectedChat.messages = selectedChat.messages;

			if (chatscroll && chatscroll.scrollHeight > chatscroll.scrollTop + chatscroll.clientHeight / 2)
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

		// update local storage for future reloading
		localStorage.setItem('chats', JSON.stringify(chats.map((x) => x.getLink())));

		// select new chat
		if (!chats.includes(selectedChat) && chats.length > 0 && idx != -1) {
			selectedChat = idx >= chats.length ? chats[chats.length - 1] : chats[idx];
			selectedChat.refreshTitle();
		} else {
			selectedChat = null;
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

	onMount(() => {
		window.scrollTo(0, document.body.scrollHeight);

		localStorage.getItem('profile') && (profile = JSON.parse(localStorage.getItem('profile')));

		const invite = getInvite();
		loadOldChat();
		if (invite) createChat(Chat.joinChat(profile, invite.chat, invite.peers));

		openChat(chats[chats.length - 1]);
	});
</script>

<svelte:head>
	<title>Chat Node</title>
	<meta name="description" content="Svelte demo app" />
	<meta name="author" content="DeanCode" />
	<meta name="description" content="A hackable decentralized chat platform" />
</svelte:head>

<Header
	{profile}
	on:profile={(e) => (openProfile = e.detail)}
	on:closeChat={(e) => closeChat(e.detail)}
	on:openChat={(e) => openChat(e.detail)}
	on:createChat={() => openChat(createChat(Chat.createChat(profile)))}
	bind:chats
	bind:selectedChat
/>

<Info bind:message={popupMessage} />

{#if openProfile}
	<Profile
		bind:profile={openProfile}
		editable={profile == openProfile}
		on:close={() => (openProfile = null)}
		on:updateProfile={(e) => {
			profile = e.detail;
			selectedChat.updateProfile(profile);
			rebuildChat();
		}}
	/>
{/if}

{#if selectedChat}
	<div class="fade-top">
		<div class="chat fade-bottom" bind:this={chatscroll}>
			<div style="height: 100px;" />
			{#each selectedChat.messages as message}
				<Message
					{message}
					showProfile={showProfilePic(message)}
					owner={message.profile == profile}
					on:profile={(e) => (openProfile = e.detail)}
				/>
			{/each}
			<div style="height: 140px;" />
		</div>
	</div>

	<Chatbox
		{profile}
		editing={!openProfile}
		on:message={(e) => sendMessage(e.detail.message)}
		on:profile={(e) => (openProfile = e.detail)}
	/>
{:else}
	<h1>Welcome to Chat Node</h1>
	<p>Click on the plus icon to create a new chat, share the link and start chatting!</p>
{/if}

<style>
	h1 {
		color: white;
		font: 50px Fira Mono, bolder;
	}

	p {
		color: white;
		font: 20px Fira Mono, bolder;
		text-align: center;
	}

	.chat {
		position: absolute;
		margin-top: 0px;
		width: 100%;
		height: 100%;
		top: 0;

		scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
		overflow: auto;
		margin-bottom: 100px;
	}

	.fade-bottom {
		mask-image: linear-gradient(to bottom, black calc(100% - 200px), transparent 100%);
	}

	.fade-top {
		mask-image: linear-gradient(to top, black calc(100% - 200px), transparent 100%);
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		bottom: 0;
	}
</style>
