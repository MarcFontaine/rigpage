<script module lang="ts">
import { ConfigVar } from '../config/ConfigVar.svelte';

const baseURL = new ConfigVar(
    { default: ''
    , path: [ 'ft8', 'DBServer' ]
    });

const filter = new ConfigVar(
    { default: 'limit=10&order=time.desc'
    , path: [ 'ft8', 'filter' ]
    });

const enableRemoteDB = new ConfigVar(
    { default: true
    , path: [ 'ft8', 'enableRemoteDB' ]
    });

</script>

<script lang="ts">
import { SvelteMap } from 'svelte/reactivity';
import { onMount } from 'svelte';
import FT8Clock from'./FT8Clock.svelte';

let decoded = new SvelteMap([]);
let selected: any = $state(null);

let filterLatest = $state('');
let fullQuery = $derived.by(joinFullQuery)

function joinFullQuery() {
  var url = baseURL.value;
  var sep = '?';
  if (filter.value) {
    url += `${sep}${filter.value}`;
    sep = '&';
  }
  if (filterLatest) {
    url += `${sep}${filterLatest}`;
    sep = '&';
  }
  return url;
}

function addDecodeFromDB(p) {
  let d = p.decode;
  d['time'] = p.time;
  if (p.tag == 'PDecode') decoded.set(p.time, d);
};

async function getFT8Decoded() {
  const response = await fetch(fullQuery, {
    method:'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  const data = await response.json();
  if (data) {
    data.toReversed().forEach((p) => addDecodeFromDB(p) );
    if (data[0].time) {
      const t = new Date(data[0].time);
      filterLatest=`time=gt.${t.toISOString()}`
    };
    return (true);
  }
  else return false;
}

onMount(() => {
  let interval = null;
  if (enableRemoteDB.value) {
    interval = setInterval(() => {
      getFT8Decoded();
    }, 4000);
  }
  window.addEventListener('wsjtx-receive', wsjtxListener);
  return () => {
    window.removeEventListener('wsjtx-receive', wsjtxListener);
    if (interval) clearInterval(interval);
  };
});

function wsjtxListener(event) {
  if (event.detail.tag == 'PDecode') {
    const t = new Date().toISOString();
    let d = event.detail.contents;
    d['time'] = t;
    decoded.set(t,d);
  }
}

</script>

{#snippet decodedRow(d)}
  <th>{d.decode_client_id}</th>
  <th>{d.time.slice(11, 19)}</th>
  <th>{d.decode_message}</th>
  <th>{d.decode_snr}</th>
  <th>{d.decode_delta_time}</th>
{/snippet}

<div>
FT8
<div style="width: 4em;" >
<FT8Clock />
</div>
<input size="60" bind:value={baseURL.value}> Postgrest base URL
<br>
<input size="60" bind:value={filter.value}> Query String
<br>
<span> Full Query: {fullQuery}</span>
<br>
<button
onclick={()=> { decoded.clear(); } }
>
Clear
</button>
<br>
{#if selected }
<button
onclick={()=> { console.log(selected); } }
>
reply to: {selected.decode_message}
</button>
{/if}

<br>
<table>
  <thead>
     <tr>
        <th>Receiver</th>
        <th>Time</th>
        <th>Message</th>
        <th>SNR</th>
	<th>dt</th>
     </tr>
  </thead>
    <tbody>
    {#each [...decoded.values()] as row}
      <tr
        onclick={ ()=> { selected = row; }}
      >
      {@render decodedRow(row)}
      </tr>
    {/each}
    </tbody>
</table>
</div>
