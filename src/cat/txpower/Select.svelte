<script lang="ts">
import { XK852Power } from '../../types';
import { rig } from '../../state.svelte';
import { setOpMode } from '../../cat';

let selected = $derived(rig.power);

</script>

<select
  bind:value={selected}
  onchange={() => {
    if (selected !== null) setOpMode(selected);
    }
  }
>
  <option value={null} selected disabled hidden>
    Unknown power mode
  </option>
  <option value={XK852Power.Off} > Off </option>
  <option value={XK852Power.RxOnly} > Receive Only </option>
  <option value={XK852Power.Low} > Low Power </option>
  <option value={XK852Power.Mid} > Medium Power </option>
  <option value={XK852Power.Full} > Full Power </option>
</select>

<style>
select {
/*  appearance: none;
  -webkit-appearance: none;
  width: 100%;
*/
  font-size:1em;
/*
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: white;
  min-height: 48px;
*/
}
</style>
