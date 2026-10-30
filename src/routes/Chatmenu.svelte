<script>
	import { emojis } from './emoji';
	import { fly, fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { createWorker } from './Script.js';
	import { onDestroy, onMount } from 'svelte';

	export let visible = false;

	const dispatch = createEventDispatcher();

	let search = '';
	let entries = [null, null, null, null, null];
	let items = [null, null, null, null, null];
	let background;
	let codeNode;

	let gifs = [];
	let timeout;
	let next = '';
	let gifError = '';
	let gifLoading = false;
	let gifRequest = 0;
	let hoverText = null;
	let editor = null;
	let textNode = null;
	let clipboardNode = null;
	let canvasContainer = null;
	let worker;
	let saves = [];


	export let previewCode = `
let ctx;

function oninit(canvas) {
	// called on start
	ctx = canvas.getContext('2d');
}

function onupdate() {
	// called 60 times per second
	// draw a red rect on screen with 'ctx'
	ctx.clearRect(0, 0, 400, 400);
	ctx.fillStyle = 'red';
	ctx.fillRect(100, 100, 200, 200);
}`;

	const tenorApiKey = import.meta.env.VITE_TENOR_API_KEY;

	onMount(() => {
		saves = getSaves();
		loadGifs(true);
	});

	export function changeMenu(index) {
		entries.forEach((entry) => entry.classList.remove('selected'));
		entries[index].classList.add('selected');

		items.forEach((item) => (item.style.display = 'none'));
		items[index].style.display = 'block';
		search = '';

		if (index == 1) {
			items[1].children[0].scrollTop = 0;
			loadGifs(true);
		}

		if (index == 2) {
			document.getElementById('chatmenu-file-upload').click();
		}

		if (index == 3) {
			if (editor && editor.toTextArea()) editor.toTextArea().remove();

			editor = CodeMirror.fromTextArea(codeNode, {
				lineNumbers: true,
				mode: {
					name: 'javascript',
					globalVars: true
				},
				extraKeys: { 'Ctrl-Space': 'autocomplete' },
				autoCloseBrackets: true,
				autoCloseTags: true,
				matchBrackets: true
			});

			editor.display.input.textarea.onkeyup = editor.display.input.textarea.onchange = () => {
				previewCode = editor.doc.children
					.map((x) => x.lines.map((y) => y.text).join('\n'))
					.join('\n');
			};

			editor.setSize(null, 600);

			startProgram();
		}
	}

	function startProgram() {
		if (worker) {
			worker.stop();
		}

		worker = createWorker(previewCode, (_state) => {});

		const canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;

		canvasContainer.innerHTML = '';
		canvasContainer.appendChild(canvas);

		worker.start(canvas, textNode);
	}

	export function setProgram(program) {
		previewCode = program;
	}

	async function loadGifs(reset = false) {
		if (!tenorApiKey) {
			gifError = 'GIF search needs a Tenor API key. Set VITE_TENOR_API_KEY in your .env file.';
			gifs = [];
			return;
		}
		if (!reset && (gifLoading || !next)) return;

		const request = ++gifRequest;
		gifLoading = true;
		gifError = '';

		try {
			const endpoint = search.trim()
				? 'https://tenor.googleapis.com/v2/search'
				: 'https://tenor.googleapis.com/v2/featured';
			const params = new URLSearchParams({
				key: tenorApiKey,
				client_key: 'chatnode',
				limit: '12',
				media_filter: 'gif,tinygif',
				contentfilter: 'medium'
			});
			if (search.trim()) params.set('q', search.trim());
			if (!reset && next) params.set('pos', next);

			const response = await fetch(`${endpoint}?${params}`);
			if (!response.ok) throw new Error(`Tenor returned HTTP ${response.status}`);
			const data = await response.json();
			if (request !== gifRequest) return;

			const results = Array.isArray(data.results) ? data.results : [];
			gifs = reset ? results : [...gifs, ...results];
			next = data.next || '';
		} catch (error) {
			if (request === gifRequest) {
				gifError = `Could not load GIFs. ${error.message}`;
				console.error('GIF search failed:', error);
			}
		} finally {
			if (request === gifRequest) gifLoading = false;
		}
	}

	function searchGifs() {
		if (timeout) clearTimeout(timeout);
		gifRequest++;
		gifLoading = false;
		next = '';
		gifs = [];
		if (items[1]) items[1].children[0].scrollTop = 0;
		timeout = setTimeout(() => loadGifs(true), 350);
	}

	function loadOnScroll(event) {
		if (event.scrollTop + event.clientHeight >= event.scrollHeight - 120) loadGifs();
	}

	function gifUrl(result, format) {
		return result.media_formats?.[format]?.url || result.media_formats?.gif?.url || '';
	}

	function handleUpload(event) {
		const files = Array.from(event.currentTarget.files || []);
		if (files.length) dispatch('files', files);
		event.currentTarget.value = '';
		dispatch('close');
	}

	function close(e) {
		if (e.target != background) return;
		search = '';
		dispatch('close');
	}

	function clipboard() {
		clipboardNode.classList.remove('bi-copy');
		navigator.clipboard.writeText(previewCode).then(
			() => clipboardNode.classList.add('bi-check-lg'),
			(_) => clipboardNode.classList.add('bi-x-lg')
		);

		setTimeout(() => resetClipboard(), 1000);
	}

	function resetClipboard() {
		clipboardNode.classList.add('bi-copy');
		clipboardNode.classList.remove('bi-check-lg');
		clipboardNode.classList.remove('bi-x-lg');
	}

	onDestroy(() => {
		if (worker) worker.stop();
	});

	function removeItemOnce(arr, value) {
		var index = arr.indexOf(value);
		if (index > -1) {
			arr.splice(index, 1);
		}
		return arr;
	}

	function save(gif) {
		saves = getSaves();

		if (isSave(gif)) {
			saves = removeItemOnce(saves, gif);
		} else {
			saves.push(gif);
		}

		localStorage.setItem('saves', JSON.stringify(saves));

		// force rebuild
		gifs = gifs; 
	}

	function isSave(gif) {
		return saves.includes(gif);
	}

	function getSaves() {
		if (typeof localStorage === 'undefined') return [];
		try {
			const saved = JSON.parse(localStorage.getItem('saves') || '[]');
			return Array.isArray(saved) ? saved : [];
		} catch {
			return [];
		}
	}
</script>

{#if visible}
	<div class="menuwindow" transition:fly={{ y: 20 }}>
		<div class="menu shadow">
			<button
				type="button"
				bind:this={entries[0]}
				on:click={() => changeMenu(0)}
				aria-label="Emoji"
				class="entry bi-emoji-smile-fill selected"
			></button>
			<button type="button" bind:this={entries[1]} on:click={() => changeMenu(1)} aria-label="GIFs" class="entry bi bi-filetype-gif"></button>
			<button type="button" bind:this={entries[2]} on:click={() => changeMenu(2)} aria-label="Upload files" class="entry bi bi-card-image"></button>
			<button
				type="button"
				bind:this={entries[3]}
				on:click={() => changeMenu(3, previewCode)}
				aria-label="Code playground"
				class="entry bi bi-code-slash"
			></button>
			<button type="button" bind:this={entries[4]} on:click={() => changeMenu(4)} aria-label="Saved GIFs" class="entry bi bi-star"></button>
		</div>

		<div bind:this={items[0]} class="item shadow" style="display: block">
			<div class="item-list grid5">
				{#each emojis.filter((x) => !search || x[1].includes(search)) as emoji}
					<button
						type="button"
						on:click={() => dispatch('emoji', emoji[0])}
						class="hover emoji"
						aria-label={`Insert ${emoji[1]}`}
						on:mouseenter={() => (hoverText = emoji[1])}
						on:mouseleave={() => (hoverText = null)}
					>
						{emoji[0]}
					</button>
				{/each}
			</div>
			<input
				bind:value={search}
				class="item-search"
				type="text"
				placeholder={hoverText || 'Search emojis'}
			/>
		</div>

		<div bind:this={items[1]} class="item shadow" style="display: none">
			<div class="item-list" on:scroll={(event) => loadOnScroll(event.currentTarget)}>
				{#each gifs as gif (gif.id)}
					<div class="gif-card">
						<button
							class="gif-save"
							aria-label={isSave(gifUrl(gif, 'gif')) ? 'Remove saved GIF' : 'Save GIF'}
							on:click={() => save(gifUrl(gif, 'gif'))}
						>
							<i class="bi bi-{isSave(gifUrl(gif, 'gif')) ? 'star-fill' : 'star'}" aria-hidden="true"></i>
						</button>
						<button
							class="gif-picker-button"
							on:click={() => dispatch('gif', gifUrl(gif, 'gif'))}
							on:mouseenter={() => {
								hoverText = gif.content_description?.replace('GIF', '') || '';
							}}
							on:mouseleave={() => (hoverText = null)}
						>
							<img
								src={gifUrl(gif, 'tinygif')}
								alt={gif.content_description || 'GIF'}
								draggable="false"
							/>
						</button>
					</div>
				{/each}
				{#if gifLoading}
					<p class="gif-status">Loading GIFs…</p>
				{:else if gifError}
					<p class="gif-status error">{gifError}</p>
				{:else if !gifs.length}
					<p class="gif-status">No GIFs found.</p>
				{/if}
			</div>
			<input
				bind:value={search}
				on:input={searchGifs}
				class="item-search"
				type="text"
				placeholder={hoverText || 'Search gifs'}
			/>
			<div class="tenor-credit">GIFs by Tenor</div>
		</div>

		<div
			bind:this={items[2]}
			class="item shadow"
			style="display: none"
		>
			<label class="upload-prompt" for="chatmenu-file-upload">
				<i class="bi bi-cloud-arrow-up-fill" aria-hidden="true"></i>
				<span>Choose files to attach</span>
			</label>
			<input
				class="visually-hidden"
				id="chatmenu-file-upload"
				type="file"
				multiple
				hidden
				aria-hidden="true"
				tabindex="-1"
				on:change={handleUpload}
			/>
		</div>

		<div bind:this={items[3]} class="item code shadow" style="display: none">
			<div class="codetext">
				<textarea bind:this={codeNode} value={previewCode}></textarea>
				<div class="codebuttons">
					<button type="button" class="bi bi-arrow-clockwise" aria-label="Restart program" on:click={startProgram}></button>
					<button type="button" class="bi bi-copy" bind:this={clipboardNode} aria-label="Copy code" on:click={clipboard}></button>
					<button
						type="button"
						class="bi bi-share-fill"
						aria-label="Share code"
						on:click={() => dispatch('gif', '```' + previewCode + '```')}
					></button>
					<button
						type="button"
						class="bi bi-send-fill"
						aria-label="Send runnable code"
						on:click={() => dispatch('gif', '```prog ' + previewCode + '```')}
					></button>
				</div>
				<div class="canvasContainer" bind:this={canvasContainer}></div>
				<p bind:this={textNode}></p>
			</div>
		</div>

		<div bind:this={items[4]} class="item item-fav shadow" style="display: none">
			<div class="item-list item-list-fav ">
				{#each saves as gif}
					<div class="gif-card">
						<button
							class="gif-save"
							aria-label="Remove saved GIF"
							on:click={() => save(gif)}
						>
							<i class="bi bi-{isSave(gif) ? 'star-fill' : 'star'}" aria-hidden="true"></i>
						</button>
						<button class="gif-picker-button" on:click={() => dispatch('gif', gif)}>
							<img src={gif} alt="Saved GIF" draggable="false" />
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<button
		class="background"
		bind:this={background}
		aria-label="Close picker"
		transition:fade={{ duration: 200 }}
		on:click={close}
	></button>
{/if}

<style>

	.gif-card {
		position: relative;
		min-width: 0;
		overflow: hidden;
		border-radius: 6px;
		background: #dce3d3;
	}

	.gif-save {
		position: absolute;
		top: 5px;
		right: 5px;
		z-index: 1;
		display: grid;
		width: 25px;
		height: 25px;
		place-items: center;
		border: 0;
		border-radius: 5px;
		background: #193b2dcc;
		color: #fbfaf2;
		cursor: pointer;
	}

	.gif-save:hover {
		background: #315b43;
	}

	.gif-picker-button {
		display: block;
		width: 100%;
		height: 110px;
		padding: 0;
		overflow: hidden;
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	.gif-picker-button img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.codetext p {
		color: red;
		position: absolute;
		bottom: 0;
		margin-left: 620px;
		left: 0;
	}

	.codebuttons {
		float: right;
		position: absolute;
		top: 0;
		right: 0;
		font-size: 30px;
		margin: 20px;
		margin-right: 10px;
	}

	.codebuttons button {
		border: 0;
		padding: 10px;
		background: #e8e9dc;
		border-radius: 6px;
		color: #203c2e;
		cursor: pointer;
	}

	.codebuttons button:hover {
		background: rgba(0, 0, 0, 0.2);
	}

	.codebuttons button:active {
		background: rgba(0, 0, 0, 0.3);
	}

	.background {
		position: fixed;
		background: rgba(0, 0, 0, 0.5);
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		border: 0;
		padding: 0;
		z-index: 0;
		cursor: default;
	}

	.menuwindow {
		width: 340px;
		position: fixed;
		left: 275px;
		bottom: 92px;
		z-index: 3;
	}

	.menu {
		background: #214533;
		height: 50px;
		width: 100%;
		overflow: hidden;
		border-radius: 8px 8px 0 0;
		margin: 0;

		font-size: 21px;
		color: #b7c8b3;

		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
		padding: 5px;
	}

	.entry {
		display: grid;
		align-items: center;
		justify-items: center;
		text-align: center;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		border-radius: 10px;
		transition: padding-top 0.2s;
		cursor: pointer;
	}

	.entry:hover {
		color: #203c2e;
	}

	.selected {
		background: #3b6549;
		color: #dce8d1;
		padding-top: 5px;
	}

	.item-search {
		outline: none;
		border: 1px solid #627e62;
		background: #193b2d;
		border-radius: 6px;
		padding: 7px 10px;
		width: calc(100% - 16px);
		margin: 8px;
		height: 34px;
		color: #f3f1e4;
	}

	.item {
		background: #214533;
		width: 100%;
		overflow: hidden;
		border-radius: 0 0 8px 8px;
		margin-left: 0;
		padding: 5px;
		position: relative;
	}

	.upload-prompt {
		display: flex;
		min-height: 120px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		border: 1px dashed #8ca878;
		border-radius: 8px;
		color: #f3f1e4;
		cursor: pointer;
	}

	.upload-prompt i {
		color: #b7cc91;
		font-size: 30px;
	}

	.gif-status {
		grid-column: 1 / -1;
		margin: 8px;
		color: #b7c8b3;
		font-size: 12px;
	}

	.gif-status.error {
		color: #f0b4a8;
	}

	.tenor-credit {
		padding: 0 10px 8px;
		color: #b7c8b3;
		font-size: 10px;
		text-align: right;
	}

	.item-fav {
		height: 299px;
	}


	.code {
		width: calc(100vw - 150px) !important;
		max-width: 1100px;
		height: 600px;
	}

	.codetext {
		max-width: 600px;
		height: 100%;
	}

	.item-list {
		scrollbar-color: #567354 transparent;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-content: start;
		height: 250px;
		width: 100%;
		overflow-x: hidden;
		overflow-y: auto;
		border-radius: 0;
		padding-right: 3px;
		user-select: none;
	}

	.item-list-fav {
		height: 300px;
	}


	.grid5 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
	}

	.emoji {
		border: 0;
		background: transparent;
		width: 50px;
		height: 50px;
		text-align: center;
		font-size: 2.3em;
		color: white;
		border-radius: 10px;
		padding-top: 4px;
	}

	.emoji:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	.shadow {
		box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.25);
	}

	img {
		display: inline;
		margin: 0 auto;
		width: 100%;
		height: auto;
	}

	.hover:hover {
		cursor: pointer;
	}

	@media (max-width: 1200px) {
		.canvasContainer {
			display: none;
		}
	}

	@media (max-width: 500px) {
		.code {
			width: calc(100% - 24px) !important;
		}

		.menuwindow {
			left: 78px;
			right: 8px;
			width: auto;
		}
	}
</style>
