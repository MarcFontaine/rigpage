<script module lang="ts">
import Option from '../settings/Options.svelte';
import { enableHamLink } from './hamlink';

</script>

<div>
  <Option bind:o={enableHamLink.value} d={'Connect to HamLink Browser Extension'} />
</div>
