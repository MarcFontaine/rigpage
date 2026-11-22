<script>
let { d, o = $bindable() } = $props();

</script>

<div>
  {d}
  <select class="selectScreen" bind:value={o} >
    <option value={'Config'} >Config</option>
    <option value={'RigControl'} >RigControl</option>
    <option value={'Debug'} >Debug</option>
    <option value={'Settings'} >Settings</option>
    <option value={'FT8'} >FT8</option>
    <option value={'Serial'} >Serial</option>
    <option value={'RigToUsb'} >RigToUsb</option>
    <option value={'Empty'} >Empty</option>
  </select>
</div>

<style>
.selectScreen {
  font-size: 1em;
}
</style>
