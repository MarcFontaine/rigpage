<script lang="ts">
import {showAntennaTuner} from '../state.svelte';
import {triggerAntennaTuner} from '../cat';
</script>

{#if showAntennaTuner}
<div>
  <button>
    onclick={triggerAntennaTuner}
  >
    Start Antenna Tuning
  </button>
</div>
{/if}
