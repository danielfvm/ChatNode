<script>
	import Popup from './Popup.svelte';

	export let message;

	let visible;

	$: visible = message && message.length > 0;

</script>

<Popup openOnStart={false} bind:visible on:close={() => (message = '')}>
	<div class="popup">
		{message}
		<button on:click={() => (message = '')}>Close</button>
	</div>
</Popup>

<style>
.popup {
	padding: 10px;
	font-size: 30px;
  justify-content: center;
  align-items: center;
}

button {
	padding: 10px;
	font-size: 25px;
	border: none;
	background: rgba(0, 0, 0, 0.2);
	border-radius: 10px;
	color: white;
	font-weight: bold;

  cursor: pointer;

  transition: background 0.3s;
}

button:hover {
	background: rgba(0, 0, 0, 0.4);
}

</style>
