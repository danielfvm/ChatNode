<script>
	import { createEventDispatcher } from 'svelte';

	export let profiles = [];

	const dispatch = createEventDispatcher();
</script>

<aside class="members">
	<h2>Members <span>{profiles.length}</span></h2>
	<div class="member-list">
		{#each profiles as member (member.id)}
			<button class="member" on:click={() => dispatch('profile', member.profile)}>
				<span class="avatar">
					<img src={member.profile.picture} alt="" />
					<span class="status"></span>
				</span>
				<span class="member-name">
					<strong>{member.profile.name}</strong>
					<small>{member.profile.pronouns || 'Online'}</small>
				</span>
			</button>
		{/each}
	</div>
</aside>

<style>
	.members {
		flex: 0 0 224px;
		width: 224px;
		height: 100%;
		overflow-y: auto;
		padding: 24px 12px;
		background: #e8e9dc;
		color: #667568;
	}

	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 8px 14px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	h2 span {
		display: grid;
		min-width: 20px;
		height: 20px;
		place-items: center;
		border-radius: 10px;
		background: #d5dfcc;
		color: #244b39;
		font-size: 10px;
		letter-spacing: 0;
	}

	.member-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.member {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 10px;
		padding: 7px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: #667568;
		text-align: left;
		cursor: pointer;
	}

	.member:hover {
		background: #dfe5d6;
		color: #203c2e;
	}

	.avatar {
		position: relative;
		display: block;
		width: 34px;
		height: 34px;
		flex: 0 0 34px;
		border-radius: 50%;
		background: #d5dfcc;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		object-fit: cover;
	}

	.status {
		position: absolute;
		right: -1px;
		bottom: -1px;
		width: 10px;
		height: 10px;
		border: 2px solid #e8e9dc;
		border-radius: 50%;
		background: #4a8a54;
	}

	.member-name {
		display: block;
		min-width: 0;
	}

	.member-name strong,
	.member-name small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.member-name strong {
		color: #203c2e;
		font-size: 13px;
		font-weight: 500;
	}

	.member-name small {
		margin-top: 3px;
		font-size: 11px;
	}

	@media (max-width: 1050px) {
		.members {
			display: none;
		}
	}
</style>
