<script>
	import Popup from './Popup.svelte';
	import { createEventDispatcher } from 'svelte';

	export let profile;
	export let editable;

	// widget bindings
	let nodeEditButton;
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
			FR.addEventListener('load', (evt) => {
				const img = new Image();
				img.src = evt.target.result;
				img.onload = () => {
					const canvas = document.createElement('canvas');
					const size = 300;
					canvas.width = size;
					canvas.height = size;
					const ctx = canvas.getContext('2d');
					const height = size / img.width * img.height;

					ctx.drawImage(img, 0, (size - height) / 2, size, height);

					tempPicture = canvas.toDataURL();
				}
			});
			FR.readAsDataURL(files[0]);
		}
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
		profile.name = tempName.length > 0 ? tempName.substring(0, 20) : profile.name;
		tempName = profile.name;

		profile.pronouns = tempPronouns.substring(0, 20);
		profile.bio = tempBio.substring(0, 256);
		profile.picture = tempPicture;
		localStorage.setItem('profile', JSON.stringify(profile));
		dispatch('updateProfile', profile);
	}

	function clickedEdit() {
		edit = !edit;

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
			<tbody>
				<tr>
					<td>
						<div class="image-cropper">
							<img
								draggable="false"
								on:contextmenu={(event) => event.preventDefault()}
								src={tempPicture}
								alt={`${tempName}'s avatar`}
							/>
							{#if edit}
								<button
									type="button"
									class="upload"
									aria-label="Upload a new profile picture"
									on:click={() => document.getElementById('file-to-upload').click()}
								>
									<div class="uploadcontent">
										<i class="bi bi-upload"></i>
									</div>
								</button>
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
						<input
							type="text"
							class="name {edit ? 'edit' : ''}"
							spellcheck="false"
							readonly={!edit}
							maxlength="20"
							bind:value={tempName}
						/>

						{#if editable}
							<button
								type="button"
								bind:this={nodeEditButton}
								class="editbutton bi bi-pencil-fill"
								aria-label={edit ? 'Save profile' : 'Edit profile'}
								on:click={clickedEdit}
							></button>
						{/if}

						<input
							class="pronouns {edit ? 'edit' : ''}"
							spellcheck="false"
							readonly={!edit}
							maxlength="20"
							bind:value={tempPronouns}
						/>
						<textarea
							class="bio {edit ? 'edit editbio' : ''}"
							spellcheck="false"
							readonly={!edit}
							maxlength="255"
							rows="4"
							bind:value={tempBio}
						></textarea>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</Popup>

<style>
	input {
		background: none;
		outline: none;
		border: none;
		color: #203c2e;
	}

	.popup {
		width: min(820px, calc(100vw - 80px));
		min-height: 230px;
		vertical-align: top;
	}

	.name {
		font-weight: bolder;
		font-size: 30px;
		outline: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: min(500px, calc(100% - 45px));
		float: left;
	}

	.editbutton {
		border: 0;
		padding: 6px;
		background: transparent;
		font-size: 22px;
		color: #8b9b84;
		transition: color 0.1s;
	}

	.editbutton:hover {
		cursor: pointer;
		color: #527a4d;
	}

	.text {
		padding-left: 50px;
		height: 240px;
		vertical-align: top;
	}

	.bio {
		background: #e8e9dc;
		border-radius: 10px;
		padding: 20px;
		height: 120px;
		width: min(500px, calc(100% - 40px));
		overflow: hidden;
		transition: background 0.1s;
		outline: none;
		color: #203c2e;
		font-size: 18px;
		border: none;
		resize: none;
	}

	.pronouns {
		float: left;
		color: #667568;
		outline: none;
		white-space: nowrap;
		overflow: hidden;
		margin-bottom: 25px;
	}

	.image-cropper {
		width: 220px;
		height: 220px;
		overflow: hidden;
		border: 3px solid #789a62;
		border-radius: 50%;
		user-select: none;
		margin: 0;
		box-shadow: 0 8px 26px #0005;
		background: #dce8d1;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: auto;
	}

	.editbio:focus {
		background: #dce8d1;
		transition: background 0.1s;
	}

	.editbio:hover {
		background: #dce8d1;
		transition: background 0.1s;
	}

	.edit {
		font-style: italic;
	}

	.upload {
		position: absolute;
		display: inline;
		top: 0;
		border: 0;
		padding: 0;
		border-radius: 50%;
		background: transparent;
		margin-top: -4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4em;
		overflow: hidden;
		color: transparent;
		transition: background 0.1s;
	}

	.upload:hover {
		background: rgba(25, 59, 45, 0.72);
		color: #fbfaf2;
	}

	.uploadcontent {
		height: 220px;
		width: 220px;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: none;
		transition: backdrop-filter 0.1s;
	}

	.uploadcontent:hover {
		backdrop-filter: blur(3px);
	}

	@media (max-width: 640px) {
		.popup {
			width: calc(100vw - 64px);
		}

		table,
		tbody,
		tr,
		td {
			display: block;
		}

		.image-cropper {
			width: 120px;
			height: 120px;
			margin: 0 auto 18px;
		}

		.uploadcontent {
			width: 120px;
			height: 120px;
		}

		.text {
			padding-left: 0;
			height: auto;
		}

		.name,
		.bio {
			width: 100%;
		}
	}
</style>
