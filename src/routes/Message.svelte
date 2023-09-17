<script>
	import { createEventDispatcher } from 'svelte';

	export let owner;
	export let message;
	export let showProfile;

	const dispatch = createEventDispatcher();

	function format_two_digits(n) {
		return n < 10 ? '0' + n : n;
	}

	function timeFormat(d) {
		const hours = format_two_digits(d.getHours());
		const minutes = format_two_digits(d.getMinutes());
		return hours + ':' + minutes;
	}

	const urls = message.text.match(/(https?:\/\/media.tenor.com\/[^\s]+)/g) || [];
	let data = message.text.replace(/(https?:\/\/media.tenor.com\/[^\s]+)/g, '');

	data = data.split(/(https?:\/\/[^\s]+)/g); // TODO: LOOP
	data = data.map((x) => {
		if (x.match(/(https?:\/\/[^\s]+)/g))
			return  { html: '<a href="' + x + '" target="_blank">' + x + '</a>', text: "" };
		return { text: x, html: "" };
	});
</script>

<div class="align" style="flex-direction: {owner ? 'row' : 'row-reverse'}">
	{#if showProfile}
		<div class="image-cropper hover" on:click={dispatch('profile', message.profile)}>
			<img
				draggable="false"
				oncontextmenu="return false;"
				src={message.profile.picture}
				alt="Profile picture"
			/>
		</div>
	{:else}
		<div class="image-cropper" />
	{/if}
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
		{#each urls as url}
			<img class="gif" src={url} />
		{/each}
	</div>
</div>

<style>
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
	}

	.chat {
		max-width: 60%;
		min-width: 220px;
		border-radius: 10px;

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
</style>
