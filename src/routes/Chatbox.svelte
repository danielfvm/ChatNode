<script>
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import Chatmenu from './Chatmenu.svelte';

	export let editing;

	let message;
	let savedRange;
	let showMenu = false;
	let chatmenuNode;
	let fileInput;
	let selectedFiles = [];
	let sending = false;
	const maxUploadBytes = 5 * 1024 * 1024;
	const maxFiles = 10;

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
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) savedRange = selection.getRangeAt(0);
	}

	function readAsDataUrl(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
			reader.readAsDataURL(file);
		});
	}

	async function send() {
		if (sending) return;
		const text = message?.innerText.trim() || '';
		if (!text && selectedFiles.length === 0) return;

		sending = true;
		try {
			const attachments = await Promise.all(
				selectedFiles.map(async (file) => ({
					name: file.name,
					type: file.type || 'application/octet-stream',
					size: file.size,
					data: await readAsDataUrl(file)
				}))
			);

			dispatch('message', { message: text, attachments });
			message.innerText = '';
			selectedFiles = [];
			showMenu = false;
		} catch (error) {
			dispatch('error', error.message);
		} finally {
			sending = false;
		}
	}

	function addFiles(files) {
		const incoming = Array.from(files || []);
		if (!incoming.length) return;

		if (selectedFiles.length + incoming.length > maxFiles) {
			dispatch('error', `You can attach up to ${maxFiles} files to a message.`);
			return;
		}

		const totalBytes = [...selectedFiles, ...incoming].reduce((total, file) => total + file.size, 0);
		if (totalBytes > maxUploadBytes) {
			dispatch('error', 'Attachments must total 5 MB or less per message.');
			return;
		}

		selectedFiles = [...selectedFiles, ...incoming];
	}

	function handleFileInput(event) {
		addFiles(event.currentTarget.files);
		event.currentTarget.value = '';
	}

	function removeFile(index) {
		selectedFiles = selectedFiles.filter((_file, fileIndex) => fileIndex !== index);
	}

	function onDrop(event) {
		event.preventDefault();
		addFiles(event.dataTransfer.files);
	}

	function onKeydown(event) {
		if (event.target !== message || event.ctrlKey || event.altKey || !editing) return;

		if (event.key === 'Escape') showMenu = false;
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			send();
		}
	}

	onMount(() => {
		focus();
		document.addEventListener('keydown', onKeydown);
	});

	onDestroy(() => document.removeEventListener('keydown', onKeydown));

	function toggleMenu() {
		showMenu = !showMenu;
	}

</script>

<div class="composer-wrap">
	<div
		class="composer"
		role="group"
		aria-label="Message composer"
		on:dragover={(event) => event.preventDefault()}
		on:drop={onDrop}
	>
		{#if selectedFiles.length}
			<div class="attachment-list">
				{#each selectedFiles as file, index (file.name + file.lastModified)}
					<div class="attachment-chip">
						<i class="bi bi-file-earmark" aria-hidden="true"></i>
						<span>{file.name}</span>
						<button aria-label={`Remove ${file.name}`} on:click={() => removeFile(index)}>
							<i class="bi bi-x" aria-hidden="true"></i>
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="composer-row">
			<input
				bind:this={fileInput}
				class="visually-hidden"
				hidden
				aria-hidden="true"
				tabindex="-1"
				type="file"
				multiple
				on:change={handleFileInput}
			/>
			<button
				class="composer-button attach-button"
				aria-label="Attach files"
				title="Attach files"
				on:click={() => fileInput.click()}
			>
				<i class="bi bi-plus-circle-fill" aria-hidden="true"></i>
			</button>
			<div
				bind:this={message}
				id="message"
				class="message-input"
				contenteditable={supportsPlainText() ? 'plaintext-only' : 'true'}
				role="textbox"
				tabindex="0"
				aria-label="Message"
				aria-multiline="true"
				placeholder="Message this conversation"
				on:keyup={save}
			></div>
			<button
				class:open={showMenu}
				class="composer-button"
				aria-label="Open GIF and emoji picker"
				title="GIFs and emoji"
				on:click={toggleMenu}
			>
				<i class="bi bi-emoji-smile" aria-hidden="true"></i>
			</button>
			<button
				class="composer-button send-button"
				aria-label="Send message"
				title="Send message"
				disabled={sending}
				on:click={send}
			>
				<i class="bi bi-send-fill" aria-hidden="true"></i>
			</button>
		</div>
		<p class="composer-hint">Enter to send · Shift + Enter for a new line · Drop files to attach</p>
	</div>
</div>

<Chatmenu
	bind:this={chatmenuNode}
	bind:visible={showMenu}
	on:files={(event) => {
		addFiles(event.detail);
		showMenu = false;
	}}
	on:emoji={(x) => (message.innerText += x.detail)}
	on:gif={(x) => {
		message.innerText += x.detail;
		send();
	}}
	on:close={() => (showMenu = false)}
/>

<style>
	.composer-wrap {
		position: relative;
		z-index: 1;
		flex: 0 0 auto;
		padding: 0 24px 18px;
		background: var(--paper);
	}

	.composer {
		max-width: 1020px;
		margin: 0 auto;
		padding: 8px 12px 0;
		border-radius: 8px;
		border: 1px solid #d4dacb;
		background: #e8e9dc;
		box-shadow: 0 4px 14px #41533c12;
	}

	.composer-row {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		min-height: 42px;
	}

	.message-input {
		flex: 1;
		min-width: 0;
		max-height: 180px;
		overflow-y: auto;
		padding: 10px 4px;
		outline: none;
		color: var(--ink);
		font-size: 15px;
		line-height: 1.4;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.message-input:empty::before {
		content: attr(placeholder);
		color: #839080;
		pointer-events: none;
	}

	.composer-button {
		display: grid;
		width: 34px;
		height: 36px;
		flex: 0 0 34px;
		place-items: center;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: #667568;
		cursor: pointer;
		font-size: 19px;
	}

	.composer-button:hover,
	.composer-button.open {
		color: #203c2e;
		background: #d5dfcc;
	}

	.attach-button {
		color: #667568;
		font-size: 22px;
	}

	.send-button {
		color: #527a4d;
	}

	.send-button:hover {
		background: #527a4d;
	}

	.send-button:disabled {
		cursor: wait;
		opacity: 0.5;
	}

	.composer-hint {
		margin: 0;
		padding: 4px 2px 6px;
		color: #7d897b;
		font-size: 10px;
	}

	.attachment-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 5px 0 8px;
	}

	.attachment-chip {
		display: flex;
		align-items: center;
		gap: 7px;
		max-width: 240px;
		padding: 5px 8px;
		border: 1px solid #cbd5c3;
		border-radius: 6px;
		background: #f6f5eb;
		color: #203c2e;
		font-size: 12px;
	}

	.attachment-chip span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-chip button {
		padding: 0;
		border: 0;
		background: transparent;
		color: #667568;
		cursor: pointer;
	}

	@media (max-width: 720px) {
		.composer-wrap {
			padding: 0 10px 12px;
		}

		.composer-hint {
			display: none;
		}
	}
</style>
