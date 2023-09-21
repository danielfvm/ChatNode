<script>
	import { createEventDispatcher } from 'svelte';
	import { onDestroy } from 'svelte';
	import { createWorker } from './Script.js';

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

	function escapeHtml(text) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};

		return text.replace(/[&<>"']/g, function (m) {
			return map[m];
		});
	}

	// create a list of text + urls
	const splitUrlAndCode = /(https?:\/\/[^\s]+)|(\`\`\`[\s\S]+?\`\`\`)/g;
	let data = message.text
		.split(splitUrlAndCode)
		.filter((x) => typeof x !== 'undefined')
		.map((x) => {
			// code
			if (x.match(/(\`\`\`[\s\S]+?\`\`\`)/g))
				return {
					html: `<textarea readonly class="messageCodePreview">${escapeHtml(
						x.substring(3, x.length - 3)
					).trim()}</textarea>`,
					text: ''
				};

			// url
			if (x.match(/(https?:\/\/[^\s]+)/g))
				return {
					html: '<a href="' + escapeHtml(x) + '" target="_blank">' + escapeHtml(x) + '</a>',
					text: ''
				};

			// plain text
			return { html: '', text: escapeHtml(x) };
		});

	// add embedded code
	let program = message.program
		? createWorker(message.program, (state) => (programState = state))
		: null;

	// Remove code enclosers
	onDestroy(() => {
		data.forEach((x) => {
			if (x.code) x.code.stop();
		});
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
>
	<div
		class="profile-pic image-cropper hover"
		style="visibility: {showProfile ? 'visible' : 'hidden'}"
		on:click={dispatch('profile', message.profile)}
	>
		<img
			draggable="false"
			oncontextmenu="return false;"
			src={message.profile.picture}
			alt="Profile picture"
		/>
	</div>
	<div class="chat shadow">
		{#if showProfile}
			<div class="name hover" on:click={dispatch('profile', message.profile)}>
				{message.profile.name}
			</div>
			<div class="time">{timeFormat(message.time)}</div>
			<br />
		{/if}
		<div class="text">
			{#each data as { text, html }}
				{text}
				{@html html}
			{/each}
		</div>
		{#each message.gifs as gif}
			<img class="gif" src={gif} />
		{/each}
		{#each message.pngs as png}
			<img class="gif" src={png} />
		{/each}
		{#if program}
			<div oncontextmenu="return false;" class="code">
				<canvas bind:this={canvasNode} style="display: none" width="400" height="400" />
				<p bind:this={messageNode}>
					<i on:click={toggleProgram} class="play bi bi-play-fill"> Click to run </i>
				</p>
			</div>
		{/if}
	</div>

	<div class="quick-menu">
		<i bind:this={clipboardNode} class="bi bi-copy" on:click={clipboard} />

		{#if owner}
			<i class="bi bi-pencil" on:click={() => dispatch('edit')} />
		{/if}

		<!---
		{#if message.gifs.length > 0 || program}
			<i class="bi bi-star" />
		{/if}
		-->

		{#if program}
			<i class="bi bi-download" on:click={downloadProgram} />
			<i class="bi bi-{programState ? 'stop' : 'play'}" on:click={toggleProgram} />
		{/if}
	</div>
</div>

<style>
	.align .quick-menu {
		color: transparent;
	}

	.align:hover .quick-menu {
		margin-top: 15px;
	}

	.align:hover .quick-menu i {
		cursor: pointer;
		background: rgba(0, 0, 0, 0.1);
		padding: 10px;
		border-radius: 10px;
		color: white;
	}

	.align:hover .quick-menu i:hover {
		background: rgba(0, 0, 0, 0.4);
	}

	.gif {
		width: 100%;
		max-width: 400px;
		height: auto;
		border-radius: 10px;
	}

	.align {
		display: flex;
		flex: 1;
		width: 100%;
		transition: background 0.2s;
	}

	.align:hover {
		background: rgba(0, 0, 0, 0.03);
	}

	.chat {
		max-width: 60%;
		min-width: 220px;
		border-radius: 10px;

		overflow: hidden;
		word-break: break-all;
		overflow-wrap: break-word;

		background: #faf0e6;
		color: gray;
		padding: 20px;
		margin: 5px;
		font-size: 20px;

		white-space: pre-line;
	}

	.name {
		font-weight: bolder;
		margin-bottom: -15px;
		text-decoration: underline;
	}

	.time {
		font-style: italic;
		font-size: 12px;
		color: gray;
		float: right;
		line-height: 7px;
	}

	.hover:hover {
		cursor: pointer;
	}

	.image-cropper {
		width: 50px;
		height: 50px;
		overflow: hidden;
		border-radius: 50%;
		user-select: none;
	}

	.shadow {
		box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.25);
	}

	canvas {
		border-radius: 5px;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: auto;
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
		cursor: pointer;
		color: gray;
		text-align: center;
		font-size: 30px;
		user-select: none;
	}

	@media (max-width: 500px) {
		.profile-pic {
			display: none;
		}

		.chat {
			max-width: 100%;
		}

		.quick-menu {
			display: none;
		}
	}
</style>
