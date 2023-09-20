<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { scale } from 'svelte/transition';
	import Chatmenu from './Chatmenu.svelte';

	export let editing;
	export let profile;
	export let changeMenu;

	let message;
	let savedRange;
	let showMenu = false;
	let chatmenuNode;

	const dispatch = createEventDispatcher();

	export function focus() {
		if (message && message != document.activeElement && editing) {
			message.focus();

			if (savedRange) {
				let s = window.getSelection();
				if (s.rangeCount > 0) s.removeAllRanges();
				s.addRange(savedRange);
			}
		}
	}

	export function setText(text) {
		message.innerText = text;
	}

	export function setEndOfContenteditable() {
		const range = document.createRange(); //Create a range (a range is a like the selection but invisible)
		range.selectNodeContents(message); //Select the entire contents of the element with the range
		range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
		const selection = window.getSelection(); //get the selection object (allows you to change selection)
		selection.removeAllRanges(); //remove any selections already made
		selection.addRange(range); //make the range you have just created the visible selection
	}

	export function changeMenuTab(index) {
		chatmenuNode.changeMenu(index);
	}

	export function openMenu(open) {
		showMenu = open;
	}

	export function setProgram(program) {
		chatmenuNode.setProgram(program);	
	}

	// https://stackoverflow.com/a/10672378
	function supportsPlainText() {
		const  d = document.createElement('div');
		try {
			d.contentEditable = 'PLAINtext-onLY';
		} catch (e) {
			return false;
		}
		return d.contentEditable == 'plaintext-only';
	}

	function save() {
		savedRange = window.getSelection().getRangeAt(0);
	}

	function send() {
		if (message.innerText.trim().length <= 0) return;

		dispatch('message', { message: message.innerText });
		message.innerText = '';

		showMenu = false;
	}

	onMount(() => {
		focus();
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey || e.altKey || !editing) return;

			//focus();

			const textLen = message ? message.innerText.trim().length : 0;

			if (e.key == 'Escape') {
				showMenu = false;
			}

			// Delayed in order to see the innerText length after editing (especially with marked text)
			setTimeout(() => {
				if (
					message &&
					message.innerText[0] == '\n' &&
					message.innerText.length <= 1 &&
					(e.key == 'Delete' || e.key == 'Backspace')
				) {
					message.innerHTML = '';
				}
			}, 4);

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

<div class="align">
	<div in:scale={{ duration: 200 }} class="profile-pic image-cropper hover" on:click={openProfile}>
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
					id="message"
					type="text"
					contenteditable={supportsPlainText() ? "plaintext-only" : "true"}
					placeholder="Type a message"
				/>

				<td class="send">
					<i
						class="{showMenu ? 'open' : ''} dots bi bi-three-dots-vertical"
						on:click={toggleMenu}
					/>
					<i class="bi bi-send-fill" on:click={send} />
				</td>
			</tr>
		</table>
	</div>
</div>

<Chatmenu
	bind:this={chatmenuNode}
	bind:visible={showMenu}
	on:emoji={(x) => (message.innerText += x.detail)}
	on:gif={(x) => {
		message.innerText += x.detail;
		send();
	}}
	on:close={() => (showMenu = false)}
/>

<style>
	.open {
		color: black;
	}

	.dots {
		transition: color 0.1s;
	}

	.dots:hover {
		color: darkgray;
	}

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
		color: gray;
		margin-right: -20px;
		margin-left: 10px;
		cursor: pointer;
		width: 60px;
		height: 20px;
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
		overflow: hidden;
		word-break: break-all;
		overflow-wrap: break-word;
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
		position: fixed;
		bottom: 0;
		margin-bottom: 10px;

		z-index: 2;
		max-height: 50%;
	}

	.chat {
		min-width: 250px;
		max-width: calc(100vw - 110px);

		background: #faf0e6;
		color: #afaf70;
		padding: 20px;
		margin: 5px;
		font-size: 20px;
		border-radius: 10px;

		white-space: pre-line;
		overflow-y: auto;
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

	.profile-pic {
		margin-left: 10px;
	}

	@media (max-width: 500px) {
		.profile-pic {
			display: none;
		}

		.chat {
			min-width: calc(100vw - 50px);
		}
	}
</style>
