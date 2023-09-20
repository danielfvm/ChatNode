<script>
	import { createEventDispatcher } from 'svelte';

	export let profiles;

	const dispatch = createEventDispatcher();
</script>

<div class="list">
	{#each profiles as profile}
		<div class="profile" on:click={() => dispatch('profile', profile)}>
			<div class="name">{profile.name}</div>
			<div class="image-cropper">
				<img
					draggable="false"
					oncontextmenu="return false;"
					src={profile.picture}
					alt="Profile picture"
				/>
			</div>
		</div>
	{/each}
</div>

<style>
	.list {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		z-index: 2;
	}

	.image-cropper {
		width: 40px;
		height: 40px;
		overflow: hidden;
		border-radius: 50%;
		user-select: none;
	}

	img {
		display: inline;
		margin: 0 auto;
		height: 100%;
		width: auto;
	}

	.name {
		font-weight: bolder;
		float: left;
		line-height: 40px;
		font-size: 18px;
		padding-left: 10px;
		margin: 0 12px 0 12px;
	}

	.profile {
		background: rgba(0, 0, 0, 0.25);
		border-radius: 40px;
		height: 40px;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
		color: lightgray;
		width: fit-content;
		white-space: nowrap;
		overflow: hidden;

		margin-top: 4px;
		margin-right: 4px;
		margin-left: auto;
	}

	.profile:hover {
		cursor: pointer;
		background: rgba(0, 0, 0, 0.5);
	}

	.hover:hover {
		cursor: pointer;
		color: #00a5ff !important;
	}
</style>
