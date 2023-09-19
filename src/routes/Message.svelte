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

	function createWorker(code) {
		// URL.createObjectURL
		window.URL = window.URL || window.webkitURL;

		console.log(code);

		let id = Math.random().toString(36).substring(7);

		// "Server response", used in all examples
		var response = `
			const exit = (msg) => postMessage({ type: 'exit', msg: msg });

			self.onmessage=function(e){
				if (e.data.rAF && typeof update !== 'undefined') {
					update(e.data.rAF);
				} else if (e.data.canvas && typeof init !== 'undefined') {
					init(e.data.canvas);
				} else if (e.data.type == 'move' && typeof mouseMove !== 'undefined') {
					mouseMove(e.data.x, e.data.y);
				} else if (e.data.type == 'down' && typeof mouseDown !== 'undefined') {
					mouseDown(e.data.x, e.data.y, e.data.button);
				} else if (e.data.type == 'up' && typeof mouseUp !== 'undefined') {
					mouseUp(e.data.x, e.data.y, e.data.button);
				}
			}
		`.replace('\n', '') + code;

		// create worker from code
		var blob;
		try {
			blob = new Blob([response], { type: 'application/javascript' });
		} catch (e) {
			// Backwards-compatibility
			window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
			blob = new BlobBuilder();
			blob.append(response);
			blob = blob.getBlob();
		}

		// wait for canvas to be created
		setTimeout(() => {
			var worker = new Worker(URL.createObjectURL(blob));

			// send canvas to worker
			var canvas = document.getElementById('canvas' + id);
			var offscreen = canvas.transferControlToOffscreen();
			worker.postMessage({ canvas: offscreen }, [offscreen]);

			// Test, used in all examples:
			worker.onmessage = function (e) {
				console.log(e);
				if (e.data.type == 'exit') {
					console.log('Worker exits ' + (e.data.msg || ''));
					worker.terminate();
				}
			};

			worker.onerror = function (e) {
				const errorNode = document.getElementById('error' + id);
				errorNode.innerText = e.message;
				errorNode.style.display = 'block';

				const messageNode = document.getElementById('canvas' + id);
				messageNode.style.display = 'none';

				worker.terminate();
			};

			canvas.onmousemove = function (e) {
				var rect = canvas.getBoundingClientRect();
				var x = e.clientX - rect.left;
				var y = e.clientY - rect.top;
				worker.postMessage({ type: 'move', x: x, y: y });
			};

			canvas.onmousedown = function (e) {
				var rect = canvas.getBoundingClientRect();
				var x = e.clientX - rect.left;
				var y = e.clientY - rect.top;
				worker.postMessage({ type: 'down', x: x, y: y, button: e.button });
			};

			canvas.onmouseup = function (e) {
				var rect = canvas.getBoundingClientRect();
				var x = e.clientX - rect.left;
				var y = e.clientY - rect.top;
				worker.postMessage({ type: 'up', x: x, y: y, button: e.button });
			};

			// update worker
			(function tick(t) {
				worker.postMessage({ rAF: t });
				requestAnimationFrame(tick);
			})(performance.now());
		}, 10);

		return id;
	}

	// extract tenor urls
	const gifs = message.text.match(/(https?:\/\/media.tenor.com\/[^\s]+)/g) || [];
	let data = message.text.replace(/(https?:\/\/media.tenor.com\/[^\s]+)/g, '');

	const pngs = message.text.match(/(data:image\/png;base64,[^\s]+)/g) || [];
	data = data.replace(/(data:image\/png;base64,[^\s]+)/g, '');

	// extract code enclosers indicated with ``` code ```
	const code = message.text.match(/(\`\`\`[\s\S]+?\`\`\`)/g) || [];
	data = data.replace(/(\`\`\`[\s\S]+?\`\`\`)/g, '');

	// create a list of text + urls
	data = data.split(/(https?:\/\/[^\s]+)/g);
	data = data.map((x) => {
		if (x.match(/(https?:\/\/[^\s]+)/g))
			return { html: '<a href="' + x + '" target="_blank">' + x + '</a>', text: '' };
		return { text: x, html: '' };
	});

	// if message contains embedded code
	if (code.length > 0) {
		const id = createWorker(code[0].substring(4, code[0].length - 5));
		data = [
			...data,
			{
				text: '',
				html: `
					<canvas id="canvas${id}" oncontextmenu="return false;" style="margin-bottom: -30px"></canvas>
					<p class="error" style="display: none" id="error${id}"></p>
				`
			}
		];
	}
</script>

<div class="align" style="flex-direction: {owner ? 'row' : 'row-reverse'}">
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
		{#each gifs as gif}
			<img class="gif" src={gif} />
		{/each}
		{#each pngs as png}
			<img class="gif" src={png} />
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

	.profile-pic {
		margin-left: 10px;
		margin-right: 10px;
	}

	@media (max-width: 500px) {
		.profile-pic {
			display: none;
		}
	}
</style>
