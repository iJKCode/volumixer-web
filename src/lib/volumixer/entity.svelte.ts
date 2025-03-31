import {onMount} from 'svelte';
import {SvelteMap} from 'svelte/reactivity';
import {unpackAny} from "$lib/volumixer/connect";

import {type Message} from "@bufbuild/protobuf";
import {type CallbackClient, createCallbackClient, type Transport} from "@connectrpc/connect";

import {EntityService, type EventStreamResponse} from "volumixer-api/gen/ts/entity/v1/entity_pb";


export type EntityMap = SvelteMap<string, Entity>;
export type Entity = {
    id: string;
    components: ComponentMap;
};

export type ComponentMap = SvelteMap<string, Component>;
export type Component = Message;


export function createEntityStore(transport: Transport) {
    const entities = new SvelteMap<string, Entity>();
    const client: CallbackClient<typeof EntityService> = createCallbackClient(EntityService, transport);
    let cancel: (() => void) | null = $state(null);

    function connect() {
        if (cancel !== null) {
            return;
        }
        console.debug("[entity] starting event stream")
        cancel = client.eventStream({
            simulateState: true,
        }, (response) => {
            applyEventStreamResponse(entities, response);
        }, (err) => {
            if (err) {
                console.error("[entity] error closing event stream", err);
            }
            console.debug("[entity] closed event stream");
            entities.clear();
            cancel = null;
        });
    }

    function disconnect() {
        if (cancel !== null) {
            console.debug("[entity] closing event stream");
            cancel();
        }
    }

    onMount(() => {
        connect();
        return disconnect;
    });

    return {
        get entities() {
            return entities;
        },
        get connected(): boolean {
            return cancel !== null;
        },
        connect() {
            connect();
        },
        disconnect() {
            disconnect();
        }
    };
}

function applyEventStreamResponse(entities: EntityMap, response: EventStreamResponse) {
    switch (response.event.case) {
        case 'entityAdded': {
            const evt = response.event.value;
            console.debug("[entity] received entity added event", evt);
            const components: ComponentMap = new SvelteMap<string, Component>();
            for (const component of evt.components) {
                const cmp = unpackAny(component)
                if (cmp) {
                    components.set(cmp.$typeName, cmp);
                } else {
                    console.warn("[entity] unknown component any", component.typeUrl);
                }
            }
            const entity = {
                id: evt.entityId,
                components: components,
            };
            entities.set(entity.id, entity);
            break;
        }

        case 'entityRemoved': {
            const evt = response.event.value;
            console.debug("[entity] received entity removed event", evt);
            entities.delete(evt.entityId);
            break;
        }

        case 'componentUpdated': {
            const evt = response.event.value;
            console.debug("[entity] received component updated event", evt);
            const ent = entities.get(evt.entityId);
            if (ent && evt.component) {
                const cmp = unpackAny(evt.component)
                if (cmp) {
                    ent.components.set(cmp.$typeName, cmp);
                } else {
                    console.warn("[entity] unknown component any", evt.component.typeUrl);
                }
            }
            break;
        }

        case 'componentRemoved': {
            const evt = response.event.value;
            console.debug("[entity] received component removed event", evt);
            const ent = entities.get(evt.entityId);
            if (ent && evt.component) {
                const cmp = unpackAny(evt.component)
                if (cmp) {
                    ent.components.delete(cmp.$typeName);
                } else {
                    console.warn("[entity] unknown component any", evt.component.typeUrl);
                }
            }
            break;
        }

        default:
            console.error("[entity] received unknown event", response.event);
            break;
    }
}
