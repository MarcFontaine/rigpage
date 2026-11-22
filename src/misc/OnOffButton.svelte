<script lang="ts">
import {showOnOffButton, rig} from '../state.svelte';
import { prebuild_cmds } from '../rig_to_usb/cmd.ts';
import { sendReport } from '../rig_to_usb/hidraw.ts';


</script>

{#if showOnOffButton.value}
{#if rig.keepRadioOn}
<div>
  <button
    onclick={() => {
      rig.keepRadioOn = false;
      sendReport(prebuild_cmds.radio_off);
    }}
  >
    Turn the Radio Off
  </button>
</div>
{:else}
<div>
  <button
    onclick={() => {
      rig.keepRadioOn = true
      sendReport(prebuild_cmds.radio_on_10s);
    }}
    >
    Turn the Radio On
  </button>
</div>
{/if}
{/if}
