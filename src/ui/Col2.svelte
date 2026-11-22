<script>
import { elementByName } from './elementByName';
import {screen1, screen2, screen3, screen4} from '../state.svelte'

const T1 = $derived(elementByName(screen1.value));
const T2 = $derived(elementByName(screen2.value));
const T3 = $derived(elementByName(screen3.value));
const T4 = $derived(elementByName(screen4.value));
</script>

<div style="display:flex; flex-direction: row; width: 100%;" >
  <div class="column" >
    <div class="tile"><T1 /></div>
    <div class="tile"><T3 /></div>
  </div>
  <div class="column" >
    <div class="tile"><T2 /></div>
    <div class="tile"><T4 /></div>
  </div>
</div>

<style>
.column {
  font-size: 0.4em;
  display:flex;
  flex-direction: column;
  width: 50%;
  padding: 0px 0px;
  margin: 0px 0px 0px 0px;
  border-width: 0px;
}
.tile {
  border: none;
  padding: 1em 1em 1em 1em;
}
</style>
