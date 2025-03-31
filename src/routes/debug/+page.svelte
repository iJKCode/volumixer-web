<script lang="ts">
    import type {Message} from '@bufbuild/protobuf'
    import {createTransport} from '$lib/volumixer/transport';
    import {createEntityStore} from '$lib/volumixer/entity';

    const transport = createTransport();
    const store = createEntityStore(transport);

    function componentToString(component: Message): string {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let {["$typeName"]: _, ...obj} = component;
        return JSON.stringify(obj)
    }
</script>

<table class="border border-collapse table-auto">
    <thead>
    <tr>
        <th>Entity ID</th>
        <th>Components</th>
    </tr>
    </thead>
    <tbody>
    {#each $store as [entityId, entity] (entityId)}
        {#each entity.components as [componentType, component], componentIndex (componentType)}
            <tr>
                {#if componentIndex === 0}
                    <td rowspan="{entity.components.size}">{entityId}</td>
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
</style>