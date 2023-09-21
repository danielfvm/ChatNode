// https://stackoverflow.com/a/17591386
function convertURIToImageData(URI) {
	return new Promise(function (resolve, reject) {
		if (URI == null) 
			return reject();

		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.onload = () => {
			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(context.getImageData(0, 0, canvas.width, canvas.height));
		};

		image.onerror = reject;
		image.src = URI;
	});
}

export function createWorker(code, onstate = (_state) => {}) {
	let listeners = [];
	let worker;

	const start = (canvas, text) => {
		onstate(true);

		text.style.display = 'none';
		canvas.style.display = 'block';


		const response = `
		const _queue = {};
		const exit = (msg) => postMessage({ type: 'exit', msg: msg });
		const loadImage = (uri) => new Promise((res, rej) => {
			postMessage({ type: 'loadImage', uri });
			_queue[uri] = { res, rej };
		});

		self.onmessage = (e) => { 
			if (e.data.type == 'loadImage') {
				if (e.data.error)
					_queue[e.data.uri].rej(e.data.error);
				else
					_queue[e.data.uri].res(e.data.data);
				delete _queue[e.data.uri];
			} else {
				e.data.type && self['on'+e.data.type] && self['on'+e.data.type](e.data.data); 
			}
		};`.replace('\n', '') + code;

		// create worker from code
		const blob = new Blob([response], {type: 'application/javascript'});
		worker = new Worker((window.URL || window.webkitURL).createObjectURL(blob));

		// Test, used in all examples:
		worker.onmessage = function (e) {
			if (e.data.type == 'exit') {
				console.log('Worker exits ' + (e.data.msg || ''));
				worker.terminate();
				onstate(false);
			}

			if (e.data.type == 'loadImage' && e.data.uri) {
				convertURIToImageData(e.data.uri).then((imageData) => {
					worker.postMessage({type: 'loadImage', uri: e.data.uri, data: imageData});
				}, (e) => {
					worker.postMessage({type: 'loadImage', uri: e.data.uri, error: e});
				});
			}
		};

		worker.onerror = function (e) {
			// set error msg
			text.innerText = e.message;
			text.style.display = 'block';

			// hide canvas
			canvas.style.display = 'none';

			worker.terminate();
			onstate(false);
		};

		// send canvas to worker
		const offscreen = canvas.transferControlToOffscreen();
		worker.postMessage({type: 'init', data: offscreen}, [offscreen]);

		// mouse events
		['mousemove', 'mousedown', 'mouseup', 'mouseleave', 'mouseenter', 'click'].forEach(
			(event) => {
				canvas.addEventListener(event, function (e) {
					worker.postMessage({
						type: event,
						data: {x: e.offsetX, y: e.offsetY, button: e.button}
					});
				});
			}
		);

		['keydown', 'keyup', 'keypress'].forEach((event) => {
			listeners.push({
				event: event,
				callback: (e) => {
					worker.postMessage({
						type: event,
						data: {
							alt: e.altKey,
							ctrl: e.ctrlKey,
							shift: e.shiftKey,
							key: e.key,
							code: e.code,
							meta: e.metaKey
						}
					});
				}
			});

			document.addEventListener(event, listeners[listeners.length - 1].callback);
		});

		// update worker
		(function tick(time) {
			worker.postMessage({type: 'update', data: time});
			requestAnimationFrame(tick);
		})(performance.now());
	};

	const stop = () => {
		if (worker) {
			worker.terminate();
		}

		listeners.forEach((listener) =>
			document.removeEventListener(listener.event, listener.callback)
		);

		onstate(false);
	};

	return {
		start,
		stop,
	}
}

