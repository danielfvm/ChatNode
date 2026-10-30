function escapeHtml(value) {
	return value.replace(/[&<>"']/g, (character) => {
		const entities = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		};
		return entities[character];
	});
}

function renderInline(value) {
	const tokens = [];
	let text = escapeHtml(value);

	text = text.replace(/`([^`\n]+)`/g, (_match, code) => {
		tokens.push(`<code>${code}</code>`);
		return `\u0000${tokens.length - 1}\u0000`;
	});

	text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (_match, label, href) => {
		tokens.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`);
		return `\u0000${tokens.length - 1}\u0000`;
	});

	text = text.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
		const punctuation = url.match(/[.,!?;:]+$/)?.[0] || '';
		const href = url.slice(0, url.length - punctuation.length);
		tokens.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>${punctuation}`);
		return `\u0000${tokens.length - 1}\u0000`;
	});

	text = text
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/__(.+?)__/g, '<strong>$1</strong>')
		.replace(/~~(.+?)~~/g, '<del>$1</del>')
		.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
		.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');

	text = text.replace(/\u0000(\d+)\u0000/g, (_match, index) => tokens[Number(index)]);
	return text;
}

export function renderMarkdown(markdown) {
	const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
	const blocks = [];
	let paragraph = [];
	let list = [];
	let code = [];
	let fenced = false;

	function flushParagraph() {
		if (!paragraph.length) return;
		blocks.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
		paragraph = [];
	}

	function flushList() {
		if (!list.length) return;
		const ordered = /^\d+[.)]\s/.test(list[0]);
		const tag = ordered ? 'ol' : 'ul';
		blocks.push(`<${tag}>${list
			.map((item) => `<li>${renderInline(item.replace(/^(?:[-*+]|\d+[.)])\s+/, ''))}</li>`)
			.join('')}</${tag}>`);
		list = [];
	}

	for (const line of lines) {
		if (/^\s*```/.test(line)) {
			flushParagraph();
			flushList();
			if (fenced) {
				blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
				code = [];
			}
			fenced = !fenced;
			continue;
		}

		if (fenced) {
			code.push(line);
			continue;
		}

		const listLine = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
		if (listLine) {
			flushParagraph();
			const ordered = /^\s*\d+[.)]\s+/.test(line);
			if (list.length && ordered !== /^\d+[.)]\s/.test(list[0])) flushList();
			list.push(line.trim());
			continue;
		}

		flushList();
		if (!line.trim()) {
			flushParagraph();
			continue;
		}

		const heading = line.match(/^(#{1,6})\s+(.+)$/);
		if (heading) {
			flushParagraph();
			const level = heading[1].length;
			blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
			continue;
		}

		if (/^>\s?/.test(line)) {
			flushParagraph();
			blocks.push(`<blockquote>${renderInline(line.replace(/^>\s?/, ''))}</blockquote>`);
			continue;
		}

		paragraph.push(line);
	}

	flushParagraph();
	flushList();
	if (fenced) blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);

	return blocks.join('');
}
