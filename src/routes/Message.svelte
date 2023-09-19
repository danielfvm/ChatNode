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
		return (self) => {
			console.log(self.target)
			const canvas = self.target.parentNode.parentNode.children[0];
			const text = self.target.parentNode.parentNode.children[1];
			
			text.style.display = 'none';
			canvas.style.display = 'block';

			const response = `
				const exit = (msg) => postMessage({ type: 'exit', msg: msg });

				self.onmessage=function(e){
					if (self[e.data.type]) {
						self[e.data.type](e.data.data);
					}
				};

				${code}
			`;

			// create worker from code
			const blob = new Blob([response], { type: 'application/javascript' });
			const worker = new Worker((window.URL || window.webkitURL).createObjectURL(blob));

			// Test, used in all examples:
			worker.onmessage = function (e) {
				if (e.data.type == 'exit') {
					console.log('Worker exits ' + (e.data.msg || ''));
					worker.terminate();
				}
			};

			worker.onerror = function (e) {
				// set error msg
				text.innerText = e.message;
				text.style.display = 'block';

				// hide canvas
				canvas.style.display = 'none';

				worker.terminate();
			};

			// send canvas to worker
			const offscreen = canvas.transferControlToOffscreen();
			worker.postMessage({ type: 'init', data: offscreen }, [offscreen]);

			// mouse events
			const events = ['mousemove', 'mousedown', 'mouseup', 'mouseleave', 'mouseenter', 'click'];
			events.forEach((event) => {
				canvas.addEventListener(event, function (e) {
					worker.postMessage({
						type: event,
						data: { x: e.offsetX, y: e.offsetY, button: e.button }
					});
				});
			});

			// update worker
			(function tick(t) {
				worker.postMessage({ type: 'update', data: t });
				requestAnimationFrame(tick);
			})(performance.now());
		};
	}

	// extract tenor urls
	const gifs = message.text.match(/(https?:\/\/media.tenor.com\/[^\s]+)/g) || [];
	let data = message.text.replace(/(https?:\/\/media.tenor.com\/[^\s]+)/g, '');

	const pngs = message.text.match(/(data:image\/png;base64,[^\s]+)/g) || [];
	data = data.replace(/(data:image\/png;base64,[^\s]+)/g, '');

	// extract code enclosers indicated with ``` code ```
	const codes = message.text.match(/(\`\`\`[\s\S]+?\`\`\`)/g) || [];
	data = data.replace(/(\`\`\`[\s\S]+?\`\`\`)/g, '');

	// create a list of text + urls
	data = data.split(/(https?:\/\/[^\s]+)/g);
	data = data.map((x) => {
		if (x.match(/(https?:\/\/[^\s]+)/g))
			return { html: '<a href="' + x + '" target="_blank">' + x + '</a>', text: '' };
		return { text: x, html: '', code: null };
	});

	// add embedded code
	codes.forEach((code) => {
		data.push({ text: '', html: '', code: createWorker(code.substring(3, code.length - 4)) });
	});
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
			{#each data as { text, html, code }}
				{text}
				{@html html}
				{#if code}
					<div oncontextmenu="return false;" class="code">
						<canvas style="display: none" width="400"  height="400"/>
						<p><i on:click={code} class="play bi bi-play-fill">Click to run </i></p>
					</div>
				{/if}
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
	}


</style>
