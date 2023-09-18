<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { scale, fly } from 'svelte/transition';
	import { create_in_transition } from 'svelte/internal';
	import Chatmenu from './Chatmenu.svelte';

	export let editing;
	export let profile;

	let chatbox, menubox;
	let message;
	let savedRange;
	let showMenu = false;

	const dispatch = createEventDispatcher();

	function focus() {
		if (message && message != document.activeElement && editing) {
			message.focus();

			if (savedRange) {
				let s = window.getSelection();
				if (s.rangeCount > 0) s.removeAllRanges();
				s.addRange(savedRange);
			}
		}
	}

	function save() {
		savedRange = window.getSelection().getRangeAt(0);
	}

	function paste(e) {
		//message.innerHTML = message.innerText;
	}

	function send() {
		if (message.innerText.trim().length <= 0) return;

		dispatch('message', { message: message.innerText });
		message.innerText = '';

		create_in_transition(chatbox, fly, { y: -50 }).start();
		if (showMenu) create_in_transition(menubox, fly, { y: -50 }).start();
	}

	onMount(() => {
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey || e.altKey || !editing) return;

			//focus();

			const textLen = message ? message.innerText.trim().length : 0;

/*			if (e.key == 'Enter') {
				setTimeout(
					() =>
						window.scrollBy({
							left: 0,
							top: document.body.scrollHeight,
							behavior: 'smooth'
						}),
					3
				);
			}*/

			if (!e.shiftKey && e.key == 'Enter' && textLen > 0) {
				send();
				e.preventDefault();
			} else if (e.key == 'Enter' && textLen == 0) {
				e.preventDefault();
			}
		});
	});

	function toggleMenu() {
		showMenu = !showMenu;
	}

	function openProfile() {
		dispatch('profile', profile);
	}
</script>

<div bind:this={chatbox} class="align">
	<div in:scale={{ duration: 200 }} class="image-cropper hover" on:click={openProfile}>
		<img
			draggable="false"
			oncontextmenu="return false;"
			src={profile.picture}
			alt="Profile picture"
		/>
	</div>

	<div on:click={focus} on:keyup={save} class="chat shadow">
		<table width="100%">
			<tr>
				<td
					bind:this={message}
					on:paste={paste}
					id="message"
					type="text"
					contenteditable="true"
					placeholder="Type a message ..."
				/>

				<td class="send">
					<i class="bi bi-three-dots-vertical" on:click={toggleMenu} />
					<i class="bi bi-send-fill" on:click={send} />
				</td>
			</tr>
		</table>
	</div>
</div>

<Chatmenu
	visible={showMenu}
	bind:menubox
	on:emoji={(x) => (message.innerText += x.detail)}
	on:gif={(x) => {
		message.innerText += x.detail;
		send();
	}}
/>

<style>
	.icon {
		transition: color 0.1s;
	}

	.icon:hover {
		cursor: pointer;
		color: black;
	}

	.send {
		vertical-align: top;
		float: right;
		margin-left: 20px;
		color: gray;
		cursor: pointer;
	}

	[contenteditable='true']:empty + i:hover {
		cursor: auto;
	}

	[contenteditable='true']:empty + td {
		color: lightgray;
	}

	[contenteditable='true']:empty:before {
		content: attr(placeholder);
		color: lightgray;
	}

	[contenteditable='true'] br {
		display: none;
	}

	#message {
		background: none;
		border: none;
		outline: none;
		color: gray;
	}

	.align {
		display: flex;
		flex: 1;
		width: 100%;
		flex-direction: row;
	}

	.chat {
		max-width: 60%;
		min-width: 250px;

		background: #faf0e6;
		color: #afaf70;
		padding: 20px;
		margin: 5px;
		font-size: 20px;
		border-radius: 10px;

		white-space: pre-line;
	}

	.name {
		font-weight: bolder;
		margin-bottom: -15px;
		text-decoration: underline;
	}

	.name:hover {
		cursor: pointer;
	}

	.shadow {
		box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.25);
	}

	.image-cropper {
		width: 50px;
		height: 50px;
		overflow: hidden;
		border-radius: 50%;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: auto;
	}

	p {
		color: white;
		font-weight: bolder;
	}

	.hover:hover {
		cursor: pointer;
	}
</style>
