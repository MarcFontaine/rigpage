<script lang="ts">
import { XK852Mode } from '../../types';
import { rig } from '../../state.svelte';
import { setMode } from '../../cat';

let selected = $derived(rig.mode);

</script>

<select
  bind:value={selected}
  onchange={() => {
    if (selected !== null) setMode(selected);
    }
  }
>
  <option value={null} selected disabled hidden>
    Unknown mode
  </option>
  <option value={XK852Mode.AME} > AME </option>
  <option value={XK852Mode.USB} > USB </option>
  <option value={XK852Mode.LSB} > LSB </option>
  <option value={XK852Mode.CW} > CW </option>
  <option value={XK852Mode.ISB} > ISB </option>
  <option value={XK852Mode.FSK_LP} > FSK Low Power </option>
  <option value={XK852Mode.FSK_MID} > FSK Medium Power </option>
  <option value={XK852Mode.FSK_HP} > FSK High Power </option>
</select>
<style>
select {
  font-size:1em;
  line-height: 2;
  padding: 0px;
  border: 0px solid #ccc;
  border-radius: 0px;
  background-color: white;
}
</style>
