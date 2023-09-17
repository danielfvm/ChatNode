<script>
	import { emojis } from './emoji';
	import { fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let visible;
	export let menubox;

	const dispatch = createEventDispatcher();

	let search;
	let entries = [null, null, null, null];
	let items = [null, null, null, null];

	let files;
	let gifs = [];
	let timeout;
	let tempPicture;

	fetch('https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=16')
		.then((res) => res.json())
		.then((data) => gifs = data.results);

	function changeMenu(index) {
		entries.forEach((entry) => entry.classList.remove('selected'));
		entries[index].classList.add('selected');

		items.forEach((item) => (item.style.display = 'none'));
		items[index].style.display = 'block';
		search = '';

		if (index == 2) {
			document.getElementById('file-to-upload').click();
		}
	}

	function searchGifs() {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fetch('https://g.tenor.com/v1/search?q=' + encodeURI(search) + '&key=LIVDSRZULELA&limit=16')
				.then((res) => res.json())
				.then((data) => {
					gifs = data.results;
					items[1].children[0].scrollTop = 0;
				});
		}, 500);
	}

	$: if (files && files.length > 0) {
		const FR = new FileReader();

		if (files[0].size >= 1024 * 1024) {
			alert('File is too large');
		} else {
			FR.addEventListener('load', (evt) => {
				tempPicture = evt.target.result
			});
			FR.readAsDataURL(files[0]);
		}
	}
</script>

{#if visible}
	<div transition:fly={{ y: -20 }} bind:this={menubox}>
		<div class="menu shadow">
			<i
				bind:this={entries[0]}
				on:click={() => changeMenu(0)}
				class="entry bi-emoji-smile-fill selected"
			/>
			<i bind:this={entries[1]} on:click={() => changeMenu(1)} class="entry bi bi-filetype-gif" />
			<i bind:this={entries[2]} on:click={() => changeMenu(2)} class="entry bi bi-card-image" />
			<i bind:this={entries[3]} on:click={() => changeMenu(3)} class="entry bi bi-code-slash" />
		</div>

		<div bind:this={items[0]} class="item shadow" style="display: block">
			<div class="item-list grid5">
				{#each emojis.filter((x) => !search || x[1].includes(search)) as emoji}
					<div on:click={() => dispatch("emoji", emoji[0])} class="hover emoji">{emoji[0]}</div>
				{/each}
			</div>
			<input bind:value={search} class="item-search" type="text" placeholder="Search emojis" />
		</div>

		<div bind:this={items[1]} class="item shadow" style="display: none">
			<div class="item-list">
				{#each gifs.reverse() as gif}
					<div class="image-cropper">
						<img
							src={gif.media[0].gif.url}
							alt={gif.content_description}
							class="hover"
							draggable="false"
							oncontextmenu="return false;"
							on:click={() => dispatch("gif", gif.media[0].gif.url)}
						/>
					</div>
				{/each}
			</div>
			<input
				bind:value={search}
				on:input={searchGifs}
				class="item-search"
				type="text"
				placeholder="Search gifs"
			/>
		</div>

		<div bind:this={items[2]} on:click={() => document.getElementById('file-to-upload').click()} class="item shadow" style="display: none">
			<input class="hidden" id="file-to-upload" type="file" accept=".png,.jpg,.gif" bind:files />
			<img class="preview" src={tempPicture} alt="Preview" />
		</div>

		<div bind:this={items[3]} class="item shadow" style="display: none" />
	</div>
{/if}

<style>

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
		width: 245px;
		margin-top: 9px;
		height: 30px;
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
</style>
