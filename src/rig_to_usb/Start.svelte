<script lang="ts">
import { onMount } from 'svelte';

import { gotoRigcontrol } from '../ui/routes';
import { toXK852Cmd } from '../cat';
import { type Cmd, CMD, prebuild_cmds, toCBOR } from './cmd';
import { isConnected, tryAutoConnectRigToUsb, connectRigToUsb } from './hidraw';

let isWorkable = $state(false);

onMount(async () => {
  if (!isConnected()) {
    tryAutoConnectRigToUsb()
      .then ((s) => isWorkable = (s !== null) )
  }
})

</script>
<div>
  <h3>
  Start RigToUsb
  </h3>
<div>
  {#if !isWorkable}
    <button
      onclick={() => {
        connectRigToUsb()
          .then(() => { if (isConnected()) gotoRigcontrol();
                      });
      }
      }
    >
    Connect RigToUsb Device
    </button>
  {/if}
</div>
</div>
