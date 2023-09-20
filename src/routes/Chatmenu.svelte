<script>
	import { emojis } from './emoji';
	import { fly, fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let visible = false;

	const dispatch = createEventDispatcher();

	let search = '';
	let entries = [null, null, null, null];
	let items = [null, null, null, null];
	let background;
	let codeNode;

	let files;
	let gifs = [];
	let timeout;
	let tempPicture;
	let next = '0';
	let scrolled = false;
	let hoverText = null;
	let editor = null;

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

	fetch('https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=8')
		.then((res) => res.json())
		.then((data) => {
			gifs = data.results;
			next = data.next;
			console.log(gifs);
		});

	export function changeMenu(index) {
		entries.forEach((entry) => entry.classList.remove('selected'));
		entries[index].classList.add('selected');

		items.forEach((item) => (item.style.display = 'none'));
		items[index].style.display = 'block';
		search = '';

		if (index == 1) {
			items[1].children[0].scrollTop = 0;
		}

		if (index == 2) {
			document.getElementById('file-to-upload').click();
		}

		if (index == 3) {
			if (editor && editor.toTextArea()) 
				editor.toTextArea().remove();

			editor = CodeMirror.fromTextArea(codeNode, {
				lineNumbers: true,
				mode: {
					name: 'javascript',
					globalVars: true
				},
				extraKeys: {"Ctrl-Space": "autocomplete"},
				autoCloseBrackets: true,
				autoCloseTags: true,
				matchBrackets: true,
			});

			editor.display.input.textarea.onkeyup = editor.display.input.textarea.onchange = () => {
				previewCode = editor.doc.children[0].lines.map(x => x.text).join('\n');
			}

			editor.setSize(null, 600);
		}
	}

	export function setProgram(program) {
		previewCode = program;
	}

	function searchGifs() {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fetch(`https://g.tenor.com/v1/search?q=${encodeURI(search)}&key=LIVDSRZULELA&limit=8&pos=${next}`)
				.then((res) => res.json())
				.then((data) => {
					gifs = [...gifs, ...data.results];
					next = data.next;
				});
		}, 500);
	}

	function loadOnScroll(e) {
		const scroll = e.scrollTop > e.scrollTopMax - e.clientHeight * 2;

		if (scrolled != scroll) {
			searchGifs();
		}

		scrolled = scroll;
	}

	function close(e) {
		if (e.target != background) return;
		search = '';
		dispatch('close');
	}

	$: if (files && files.length > 0) {
		const FR = new FileReader();

		FR.addEventListener('load', (evt) => {
			const img = new Image();
			img.src = evt.target.result;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const max = Math.max(img.width, img.height);
				const size = 500;

				if (max > size) {
					if (img.width > img.height) {
						img.height = (size / img.width) * img.height;
						img.width = size;
					} else {
						img.width = (size / img.height) * img.width;
						img.height = size;
					}
				}

				canvas.width = img.width;
				canvas.height = img.height;

				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, img.width, img.height);

				tempPicture = canvas.toDataURL();
				dispatch('gif', tempPicture);
			};
		});
		FR.readAsDataURL(files[0]);
		files = [];
	}

</script>

{#if visible}
	<div class="menuwindow" transition:fly={{ y: 20 }}>
		<div class="menu shadow">
			<i
				bind:this={entries[0]}
				on:click={() => changeMenu(0)}
				class="entry bi-emoji-smile-fill selected"
			/>
			<i bind:this={entries[1]} on:click={() => changeMenu(1)} class="entry bi bi-filetype-gif" />
			<i bind:this={entries[2]} on:click={() => changeMenu(2)} class="entry bi bi-card-image" />
			<i bind:this={entries[3]} on:click={() => changeMenu(3, previewCode)} class="entry bi bi-code-slash" />
		</div>

		<div bind:this={items[0]} class="item shadow" style="display: block">
			<div class="item-list grid5">
				{#each emojis.filter((x) => !search || x[1].includes(search)) as emoji}
					<div
						on:click={() => dispatch('emoji', emoji[0])}
						class="hover emoji"
						on:mouseenter={() => (hoverText = emoji[1])}
						on:mouseleave={() => (hoverText = null)}
					>
						{emoji[0]}
					</div>
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
			<div class="item-list" on:scroll={() => loadOnScroll(items[1].children[0])}>
				{#each gifs as gif}
					<div class="image-cropper">
						<img
							src={gif.media[0].gif.preview}
							alt={gif.content_description}
							class="hover"
							draggable="false"
							oncontextmenu="return false;"
							on:click={(x) => dispatch('gif', x.target.src)}
							on:mouseenter={(x) => {
								x.target.src = gif.media[0].gif.url;
								hoverText = gif.content_description.replace('GIF', '');
							}}
							on:mouseleave={(x) => {
								x.target.src = gif.media[0].gif.preview;
								hoverText = null;
							}}
						/>
					</div>
				{/each}
			</div>
			<input
				bind:value={search}
				on:input={() => {
					items[1].children[0].scrollTop = 0;
					gifs = [];
					next = '0';
					searchGifs();
				}}
				class="item-search"
				type="text"
				placeholder={hoverText || 'Search gifs'}
			/>
		</div>

		<div
			bind:this={items[2]}
			on:click={() => document.getElementById('file-to-upload').click()}
			class="item shadow"
			style="display: none"
		>
			<input class="hidden" id="file-to-upload" type="file" accept=".png,.jpg,.gif" bind:files />
			<img class="preview" src={tempPicture} alt="Preview" />
		</div>

		<div bind:this={items[3]} class="item code shadow" style="display: none">
			<div class="codetext">
				<textarea bind:this={codeNode} value={previewCode} />
			</div>
		</div>
	</div>
	<div
		class="background"
		bind:this={background}
		transition:fade={{ duration: 200 }}
		on:click={close}
	/>
{/if}

<style>
	.background {
		position: fixed;
		background: rgba(0, 0, 0, 0.5);
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: 0;
	}

	.menuwindow {
		width: max-content;
		position: absolute;
		margin-left: 10px;
		transform: translateY(-100px);
		bottom: 0;
		z-index: 3;
	}

	.preview {
		width: 100%;
	}

	.hidden {
		display: none;
	}

	.upload {
		text-align: center;
		margin-top: 30px;
		font: 22px Fira Mono, bolder;
	}

	.menu {
		background: #ebe1d8;
		height: 50px;
		width: 255px;
		overflow: hidden;
		border-radius: 10px;
		margin-top: 10px;
		margin-left: 56px;
		margin-bottom: -20px;

		font-size: 25px;
		color: gray;

		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		padding: 5px;
	}

	.entry {
		align-items: center;
		justify-items: center;
		text-align: center;
		border-radius: 10px;
		transition: padding-top 0.2s;
	}

	.entry:hover {
		color: black;
	}

	.selected {
		background: #faf0e6;
		color: black;
		padding-top: 5px;
		box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.15);
	}

	.item-search {
		outline: none;
		border: none;
		background: #ebe1d8;
		border-radius: 10px;
		padding: 5px;
		width: 235px;
		margin-top: 9px;
		height: 30px;
		padding-left: 15px;
	}

	.item {
		background: #faf0e6;
		height: 300px;
		width: 255px;
		overflow: hidden;
		border-radius: 10px;
		margin-left: 56px;
		padding: 5px;
		position: relative;
	}

	.code {
		width: calc(100vw - 150px) !important;
		height: 600px;
	}

	.codetext {
		max-width: 600px;
		height: 100%;
	}

	.item-list {
		scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
		height: 250px;
		width: 255px;
		overflow-x: hidden;
		overflow-y: auto;
		border-radius: 10px;
		padding-right: 5px;
		user-select: none;
	}

	.grid5 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
	}

	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-gap: 5px;
	}

	.emoji {
		width: 50px;
		height: 50px;
		text-align: center;
		font-size: 2.3em;
		color: white;
		border-radius: 10px;
		padding-top: 4px;
	}

	.emoji:hover {
		cursor: pointer;
		background: rgba(0, 0, 0, 0.1);
	}

	.shadow {
		box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.25);
	}

	.image-cropper {
		overflow: hidden;
		border-radius: 10px;
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

	@media (max-width: 500px) {
		.menu {
			margin-left: 0px;
		}

		.item {
			margin-left: 0px;
		}

		.code {
			width: calc(100% - 24px) !important;
		}

		.menuwindow {
			width: 100%;
		}
	}
</style>
