<script>
	import { createEventDispatcher } from 'svelte';
	import { onDestroy } from 'svelte';
	import { createWorker } from './Script.js';
	import { renderMarkdown } from './markdown.js';

	export let owner;
	export let message;
	export let showProfile;

	const dispatch = createEventDispatcher();
	let clipboardNode;
	let canvasNode;
	let messageNode;
	let programState = false;

	function formatTwoDigits(n) {
		return n < 10 ? '0' + n : n;
	}

	function timeFormat(d) {
		const hours = formatTwoDigits(d.getHours());
		const minutes = formatTwoDigits(d.getMinutes());
		return hours + ':' + minutes;
	}

	// add embedded code
	let program = message.program
		? createWorker(message.program, (state) => (programState = state))
		: null;

	// Remove code enclosers
	onDestroy(() => {
		if (program) program.stop();
	});

	function clipboard() {
		clipboardNode.classList.remove('bi-copy');
		navigator.clipboard.writeText(message.data).then(
			() => clipboardNode.classList.add('bi-check-lg'),
			(_) => clipboardNode.classList.add('bi-x-lg')
		);
	}

	function resetClipboard() {
		clipboardNode.classList.add('bi-copy');
		clipboardNode.classList.remove('bi-check-lg');
		clipboardNode.classList.remove('bi-x-lg');
	}

	function toggleProgram() {
		if (!program) return;

		if (programState) {
			program.stop();

			// force rebuild of program widget
			let oldProg = program;
			program = null;
			setTimeout(() => (program = oldProg), 10);
		} else {
			program.start(canvasNode, messageNode);
		}
	}

	function download(filename, text) {
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}

	async function downloadProgram() {
		if (!program) return;

		const response = await fetch('scaffold.html');
		const text = await response.text();

		// Replace placeholder with code and add indent
		const prog = message.program.trim().split('\n').map(x => '\t\t\t' + x).join('\n');
		const code = text.replace('$CODE', prog);

		download('script.html', code);
	}
</script>

<div
	class="align"
	style="flex-direction: {owner ? 'row' : 'row-reverse'}"
	on:mouseenter={resetClipboard}
	role="group"
	aria-label={`Message from ${message.profile.name}`}
>
	<button
		class="profile-pic image-cropper hover"
		style="visibility: {showProfile ? 'visible' : 'hidden'}"
		aria-label={`View ${message.profile.name}'s profile`}
		on:click={() => dispatch('profile', message.profile)}
	>
		<img
			draggable="false"
			on:contextmenu={(event) => event.preventDefault()}
			src={message.profile.picture}
			alt=""
		/>
	</button>
	<div class="chat">
		{#if showProfile}
			<div class="message-heading">
				<button class="name hover" on:click={() => dispatch('profile', message.profile)}>
					{message.profile.name}
				</button>
				<span class="time">{timeFormat(message.time)}</span>
			</div>
		{/if}
		{#if message.text}
			<div class="text">{@html renderMarkdown(message.text)}</div>
		{/if}
		{#each message.gifs as gif}
			<img class="gif" src={gif} alt="Shared GIF" loading="lazy" />
		{/each}
		{#each message.pngs as png}
			<img class="gif" src={png} alt="" loading="lazy" />
		{/each}
		{#each message.attachments as attachment}
			{#if ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'].includes(attachment.type)}
				<a class="attachment-image" href={attachment.data} target="_blank" rel="noopener noreferrer">
					<img src={attachment.data} alt={attachment.name} loading="lazy" />
				</a>
			{:else}
				<a
					class="file-attachment"
					href={attachment.data}
					download={attachment.name}
					title={`${attachment.name} (${Math.ceil(attachment.size / 1024)} KB)`}
				>
					<i class="bi bi-file-earmark-arrow-down-fill" aria-hidden="true"></i>
					<span>{attachment.name}</span>
					<small>{Math.ceil(attachment.size / 1024)} KB</small>
				</a>
			{/if}
		{/each}
		{#if program}
			<div on:contextmenu={(event) => event.preventDefault()} class="code" role="group">
				<canvas bind:this={canvasNode} style="display: none" width="400" height="400"></canvas>
				<p bind:this={messageNode}>
					<button type="button" on:click={toggleProgram} class="play bi bi-play-fill">
						Click to run
					</button>
				</p>
			</div>
		{/if}
	</div>

	<div class="quick-menu">
		<button type="button" bind:this={clipboardNode} class="bi bi-copy" aria-label="Copy message" on:click={clipboard}></button>

		{#if owner}
			<button type="button" class="bi bi-pencil" aria-label="Edit message" on:click={() => dispatch('edit')}></button>
		{/if}

		<!---
		{#if message.gifs.length > 0 || message.attachments.length > 0 || program}
			<i class="bi bi-star" />
		{/if}
		-->

		{#if program}
			<button type="button" class="bi bi-download" aria-label="Download program" on:click={downloadProgram}></button>
			<button
				type="button"
				class="bi bi-{programState ? 'stop' : 'play'}"
				aria-label={programState ? 'Stop program' : 'Run program'}
				on:click={toggleProgram}
			></button>
		{/if}
	</div>
</div>

<style>
	.align .quick-menu {
		display: flex;
		gap: 4px;
		margin-top: 15px;
		color: #60725e;
	}

	.quick-menu button {
		display: inline-grid;
		width: 32px;
		height: 32px;
		place-items: center;
		border: 0;
		border-radius: 8px;
		background: #e6eadc;
		color: #49664a;
		cursor: pointer;
		transition: background-color 120ms ease, color 120ms ease;
	}

	.quick-menu button:hover {
		background: #d3dfc8;
		color: #203c2e;
	}

	.gif {
		display: block;
		width: auto;
		max-width: min(440px, 100%);
		height: auto;
		max-height: 480px;
		border-radius: 8px;
		margin-top: 10px;
	}

	.attachment-image img {
		display: block;
		width: auto;
		height: auto;
		max-width: min(440px, 100%);
		max-height: 480px;
		object-fit: contain;
		border-radius: 8px;
		margin-top: 10px;
	}

	.file-attachment {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		max-width: min(440px, 100%);
		margin-top: 10px;
		padding: 12px 14px;
		border: 1px solid #cbd5c3;
		border-radius: 8px;
		background: #f6f5eb;
		color: #203c2e;
	}

	.file-attachment i {
		font-size: 24px;
		color: #527a4d;
	}

	.file-attachment span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-attachment small {
		color: #667568;
		white-space: nowrap;
	}

	.align {
		display: flex;
		flex: 1;
		width: 100%;
		align-items: flex-start;
		padding: 5px 16px;
		transition: background 0.15s;
	}

	.align:hover {
		background: #e8e9dc;
	}

	.chat {
		flex: 1;
		max-width: 900px;
		min-width: 0;
		border-radius: 8px;
		overflow: hidden;
		word-break: break-word;
		overflow-wrap: break-word;
		background: transparent;
		color: #203c2e;
		padding: 4px 0;
		margin: 0;
		font-size: 15px;
		line-height: 1.45;
	}

	:global(.text p) {
		margin: 0 0 8px;
	}

	:global(.text p:last-child) {
		margin-bottom: 0;
	}

	:global(.text h1),
	:global(.text h2),
	:global(.text h3) {
		margin: 8px 0;
		color: #203c2e;
		font-weight: 650;
	}

	:global(.text ul),
	:global(.text ol) {
		margin: 4px 0;
		padding-left: 24px;
	}

	:global(.text blockquote) {
		margin: 4px 0;
		padding-left: 10px;
		border-left: 3px solid #9cad8c;
		color: #526553;
	}

	:global(.text pre) {
		max-width: 100%;
		margin: 8px 0;
		padding: 12px;
		overflow-x: auto;
		border: 1px solid #d4dacb;
		border-radius: 6px;
		background: #e8e9dc;
		color: #203c2e;
		font: 13px/1.5 'Fira Mono', monospace;
		white-space: pre;
	}

	:global(.text code) {
		padding: 2px 4px;
		border-radius: 4px;
		background: #e8e9dc;
		color: #527a4d;
		font: 0.9em 'Fira Mono', monospace;
	}

	:global(.text pre code) {
		padding: 0;
		background: transparent;
		color: inherit;
	}

	:global(.text a) {
		color: #3d704d;
		text-decoration: underline;
	}

	.name {
		border: 0;
		padding: 0;
		background: transparent;
		color: #203c2e;
		font: inherit;
		font-weight: 600;
	}

	.time {
		font-size: 11px;
		color: #667568;
	}

	.message-heading {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 2px;
	}

	.hover:hover {
		cursor: pointer;
	}

	.image-cropper {
		width: 40px;
		height: 40px;
		overflow: hidden;
		border-radius: 50%;
		user-select: none;
		flex: 0 0 40px;
		background: #789a62;
		border: 2px solid #f2f1e7;
	}

	.profile-pic {
		padding: 0;
		cursor: pointer;
	}

	canvas {
		border-radius: 5px;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	p {
		color: red;
		line-height: 0px;
		font-weight: bolder;
	}

	.profile-pic {
		margin-left: 10px;
		margin-right: 10px;
	}

	.play {
		display: inline-block;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
		color: gray;
		text-align: center;
		font-size: 20px;
		user-select: none;
	}

	@media (max-width: 500px) {
		.chat {
			max-width: 100%;
		}

		.align {
			padding: 5px 10px;
		}

		.quick-menu {
			display: none;
		}

		.quick-menu {
			display: none;
		}
	}
</style>
