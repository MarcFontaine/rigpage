<script lang="ts">
import { onMount } from 'svelte';
import * as DecadeSettings from './DecadeSettings.svelte';
import DecadeDigit from '../misc/DecadeDigitSplit.svelte';
import {gui, rig} from '../state.svelte';
import {} from '../cat';

let bfo = $state(0);
function setValue(f:number) {
  bfo = f;
}

</script>

{#snippet myDigit(exp)}
  <DecadeDigit
    isConfirmed = {false}
    rounding = { false }
    exp = { exp }
    min = { -999 }
    max = { 999 }
    value = { bfo }
    setter = { f => setValue(f) }
    wheelSpeed = { DecadeSettings.mouseWheelTuningSpeed.value / 400/ 125 }
    clickSpeed = { 1 }
    gap = { 0 }
    width = "25%"
  />
{/snippet}

<div class="decade" >
  <DecadeDigit
    isConfirmed = { false }
    char = {bfo > 0 ? '+' : '-' }
    setter =  { d => { return;}}
    wheelSpeed = 0
    clickSpeed = 0
    gap = 0
    width ="25%"
  />
  {@render myDigit(100)}
  {@render myDigit(10)}
  {@render myDigit(1)}
</div>

<style>
.decade {
  width: 25%;
  container-type: inline-size;
  display:flex;
  flex-direction: row;
  font-size: 3em;
  --digit-font-size: 40cqw;
}
</style>
