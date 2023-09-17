<script>
	import Popup from './Popup.svelte';
	import { createEventDispatcher } from 'svelte';

	export let profile;
	export let editable;

	// widget bindings
	let nodeName, nodePronouns, nodeBio, nodeEditButton;
	let files;

	// temporary profile edits
	let tempName = profile.name;
	let tempPronouns = profile.pronouns;
	let tempBio = profile.bio;
	let tempPicture = profile.picture;

	// is in edit mode or not
	let edit = false;

	const dispatch = createEventDispatcher();

	$: if (edit && files && files.length > 0) {
		const FR = new FileReader();

		if (files[0].size >= 1024 * 1024) {
			alert('File is too large');
		} else {
			FR.addEventListener('load', (evt) => (tempPicture = evt.target.result));
			FR.readAsDataURL(files[0]);
		}
	}

	function formatText(text, e, maxLines) {
		const lineCount = (text.match('\n') || []).length + 1;

		if (e.key == 'ArrowLeft' || e.key == 'ArrowRight' || e.key == 'ArrowUp' || e.key == 'ArrowDown')
			return;

		if (maxLines == 1 && text.length >= 15 && e.key != 'Backspace' && e.key != 'Delete')
			e.preventDefault();

		if (e.key == 'Enter' && lineCount >= maxLines) e.preventDefault();

		if (e.key == 'Tab') e.preventDefault();
	}

	function didUpdateProfile() {
		return (
			tempName != profile.name ||
			tempPronouns != profile.pronouns ||
			tempBio != profile.bio ||
			tempPicture != profile.picture
		);
	}

	function updateProfile() {
		profile.name = tempName;
		profile.pronouns = tempPronouns;
		profile.bio = tempBio;
		profile.picture = tempPicture;
		localStorage.setItem('profile', JSON.stringify(profile));
		dispatch('updateProfile', profile);
	}

	function clickedEdit() {
		edit = !edit;

		nodeName.contentEditable = edit;
		nodePronouns.contentEditable = edit;
		nodeBio.contentEditable = edit;

		if (nodeEditButton && edit) {
			nodeEditButton.classList.remove('bi-pencil-fill');
			nodeEditButton.classList.add('bi-check-lg');
		} else if (nodeEditButton && !edit) {
			nodeEditButton.classList.remove('bi-check-lg');
			nodeEditButton.classList.add('bi-pencil-fill');

			if (didUpdateProfile()) {
				updateProfile();
			}
		}
	}
</script>

<Popup on:close>
	<div class="popup">
		<table>
			<tr>
				<td>
					<div class="image-cropper">
						<img
							draggable="false"
							oncontextmenu="return false;"
							src={tempPicture}
							alt="Profile picture"
						/>
						{#if edit}
							<div
								class="upload"
								on:click={() => document.getElementById('file-to-upload').click()}
							>
								<div class="uploadcontent">
									<i class="bi bi-upload" />
								</div>
							</div>
							<input
								class="hidden"
								id="file-to-upload"
								type="file"
								accept=".png,.jpg,.gif"
								bind:files
							/>
						{/if}
					</div>
				</td>

				<td class="text">
					<div
						class="name {edit ? 'edit' : ''}"
						spellcheck="false"
						contenteditable="false"
						bind:this={nodeName}
						bind:innerText={tempName}
						on:keydown={(e) => formatText(profile.name, e, 1)}
					/>

					{#if editable}
						<i bind:this={nodeEditButton} class="editbutton bi bi-pencil-fill" on:click={clickedEdit} />
					{/if}

					<div
						class="pronouns {edit ? 'edit' : ''}"
						spellcheck="false"
						contenteditable="false"
						bind:this={nodePronouns}
						bind:innerText={tempPronouns}
						on:keydown={(e) => formatText(profile.pronouns, e, 1)}
					/>
					<div
						class="bio {edit ? 'edit editbio' : ''}"
						spellcheck="false"
						contenteditable="false"
						bind:this={nodeBio}
						bind:innerText={tempBio}
						on:keydown={(e) => formatText(profile.bio, e, 3)}
					/>
				</td>
			</tr>
		</table>
	</div>
</Popup>

<style>
	.popup {
		width: 900px;
		height: 250px;
		vertical-align: top;
	}

	.name {
		font-weight: bolder;
		font-size: 30px;
		outline: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 570px;
		float: left;
	}

	.editbutton {
		font-size: 22px;
		color: rgba(255, 255, 255, 0.2);
		transition: color 0.1s;
	}

	.editbutton:hover {
		cursor: pointer;
		color: rgba(255, 255, 255, 0.3);
	}

	.text {
		padding-left: 50px;
		height: 240px;
		vertical-align: top;
	}

	.bio {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 20px;
		margin-top: 20px;
		height: 120px;
		width: 560px;
		overflow: hidden;
		transition: background 0.1s;
		outline: none;
	}

	.pronouns {
		float: left;
		color: gray;
		outline: none;
		white-space: nowrap;
		overflow: hidden;
		margin-bottom: 25px;
	}

	.image-cropper {
		width: 300px;
		height: 300px;
		overflow: hidden;
		border-radius: 10px;
		user-select: none;
		margin: -30px;
		background: #524b66;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: auto;
	}

	.editbio:focus {
		background: rgba(255, 255, 255, 0.2);
		transition: background 0.1s;
	}

	.editbio:hover {
		background: rgba(255, 255, 255, 0.2);
		transition: background 0.1s;
	}

	.edit {
		font-style: italic;
	}

	.upload {
		position: absolute;
		display: inline;
		top: 0;
		border-radius: 10px;
		background: transparent;
		margin-top: -7px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4em;
		overflow: hidden;
		color: transparent;
		transition: background 0.1s;
	}

	.upload:hover {
		background: rgba(0, 0, 0, 0.7);
		color: white;
	}

	.uploadcontent {
		height: 300px;
		width: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: none;
		transition: backdrop-filter 0.1s;
	}

	.uploadcontent:hover {
		backdrop-filter: blur(3px);
	}
</style>
