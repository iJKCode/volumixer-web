<script lang="ts">
    import {base} from '$app/paths';

    import {type Message} from '@bufbuild/protobuf'
    import {createTransport} from '$lib/volumixer/connect';
    import {createEntityStore} from '$lib/volumixer/entity.svelte';

    const transport = createTransport();
    const store = createEntityStore(transport);

    function componentToString(component: Message): string {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let {["$typeName"]: _, ...obj} = component;
        return JSON.stringify(obj)
    }
</script>

<a href="{base}/" class="underline">home</a>

<table class="border border-collapse table-auto">
    <thead>
    <tr>
        <th>Entity Store</th>
        <td>
            <span>connection: </span>
            {#if store.connected}
                <button class="bg-green-200" on:click={() => {store.disconnect()}}>connected</button>
            {:else}
                <button class="bg-red-200" on:click={() => {store.connect()}}>disconnected</button>
            {/if}
        </td>
    </tr>
    <tr>
        <th>ID</th>
        <th>Components</th>
    </tr>
    </thead>
    <tbody>
    {#each store.entities.values() as entity (entity.id)}
        {#each entity.components.values() as component, componentIndex (component.$typeName)}
            <tr>
                {#if componentIndex === 0}
                    <td rowspan="{entity.components.size}">{entity.id}</td>
                {/if}
                <td>{componentToString(component)}</td>
            </tr>
        {/each}
    {/each}
    </tbody>
</table>

<style lang="postcss">
    @reference "tailwindcss";
    th, td {
        padding: 0.5rem;
        border: 1px solid black;
    }

    button {
        padding: 0 0.5rem 0 0.5rem;
        border: 1px solid black;
    }
</style>