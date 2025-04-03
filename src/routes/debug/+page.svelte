<script lang="ts">
    import {base} from '$app/paths';

    import {type Message, type MessageShape, type DescMessage, isMessage} from '@bufbuild/protobuf'
    import {createTransport} from '$lib/volumixer/connect';
    import {type ComponentMap, createEntityStore, type Entity} from '$lib/volumixer/entity.svelte';
    import {createVolumeClient} from "$lib/volumixer/volume";

    import {InfoComponentSchema} from 'volumixer-api/gen/ts/widget/v1/info_pb'
    import {VolumeComponentSchema} from 'volumixer-api/gen/ts/widget/v1/volume_pb'

    function fromLevel(level: number): number {
        return Math.round(level * 100);
    }

    function fromPercent(percent: number): number {
        return Math.round(percent) / 100;
    }

    const transport = createTransport();
    const store = createEntityStore(transport);
    const volume = createVolumeClient(transport);
    const volstep = fromPercent(5);

    function componentToString(component: Message): string {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let {["$typeName"]: _, ...obj} = component;
        return JSON.stringify(obj)
    }

    function getComponent<T extends DescMessage>(components: ComponentMap, schema: T): MessageShape<T> | null {
        return components.get(schema.typeName) as MessageShape<T> | null;
    }

    function sortComponents(items: Iterable<Message>) {
        return Array.from(items).toSorted((a, b) => a.$typeName.localeCompare(b.$typeName))
    }

    function sortEntities(items: Iterable<Entity>) {
        return Array.from(items).toSorted((a, b) => {
            const a_info = getComponent(a.components, InfoComponentSchema);
            const b_info = getComponent(b.components, InfoComponentSchema);

            if (a_info !== null && b_info !== null) {
                return a_info.name.localeCompare(b_info.name);
            } else if (a_info !== null) {
                return -1;
            } else if (b_info !== null) {
                return 1;
            } else {
                return a.id.localeCompare(b.id);
            }
        })
    }

    function signedValue(sign: number, value: number) {
        if (sign > 0) {
            return value
        } else if (sign < 0) {
            return -value;
        }
        return 0;
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
                <button class="bg-green-200" onclick={() => {store.disconnect()}}>connected</button>
            {:else}
                <button class="bg-red-200" onclick={() => {store.connect()}}>disconnected</button>
            {/if}
        </td>
    </tr>
    <tr>
        <th>ID</th>
        <th>Components</th>
    </tr>
    </thead>
    <tbody>
    {#each sortEntities(store.entities.values()) as entity (entity.id)}
        {#each sortComponents(entity.components.values()) as component, componentIndex (component.$typeName)}
            <tr>
                {#if componentIndex === 0}
                    <td rowspan="{entity.components.size}">{entity.id}</td>
                {/if}
                {#if isMessage(component, InfoComponentSchema)}
                    <td>name: {component.name}</td>
                {:else if isMessage(component, VolumeComponentSchema)}
                    <td>
                        <span style="display: inline-block; width: 5em">level: {Math.round(component.level * 100.0)}</span>
                        <button class="bg-blue-200" onclick={() => {
                            volume.setVolumeLevel(entity.id, component.level - volstep);
                        }}>-
                        </button>
                        <input
                                class="bg-blue-200"
                                type="range" min="0" max="150" step="1"
                                value="{fromLevel(component.level)}"
                                oninput={(evt) => volume.setVolumeLevel(entity.id, fromPercent(evt.target.value))}
                                onwheel={(evt) => volume.setVolumeLevel(entity.id, component.level + signedValue(-evt.deltaY, volstep))}
                        />
                        <button class="bg-blue-200" onclick={() => {
                            volume.setVolumeLevel(entity.id, component.level + volstep);
                        }}>+
                        </button>
                        <span>muted: </span>
                        <button class={component.muted ? "bg-red-200" : "bg-green-200"} onclick={() => {
                            volume.setVolumeMute(entity.id, !component.muted);
                        }}>{component.muted ? 'yes' : 'no'}</button>
                    </td>
                {:else}
                    <td>{componentToString(component)}</td>
                {/if}
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