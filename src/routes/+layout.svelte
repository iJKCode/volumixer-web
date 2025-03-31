<script lang="ts">
    import {dev} from '$app/environment';
    import {RenderScan} from 'svelte-render-scan';

    import '../app.css';

    let {children} = $props();
</script>

{#if dev}
    <RenderScan initialEnabled={false}/>
{/if}

{@render children()}
