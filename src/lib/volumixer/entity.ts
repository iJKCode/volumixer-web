import {type Readable, readable} from 'svelte/store';
import {componentRegistry} from '$lib/volumixer/component';

import {type Message} from '@bufbuild/protobuf';
import {anyUnpack} from '@bufbuild/protobuf/wkt';
import {createCallbackClient, type Transport} from '@connectrpc/connect';

import {EntityService, type EventStreamResponse} from 'volumixer-api/gen/ts/entity/v1/entity_pb';


export type EntityMap = Map<string, Entity>;
export type Entity = {
    id: string;
    components: ComponentMap;
};

export type ComponentMap = Map<string, Component>;
export type Component = Message;


export function createEntityStore(transport: Transport): Readable<EntityMap> {
    const client = createCallbackClient(EntityService, transport);
    return readable<EntityMap>(new Map<string, Entity>(), (_, update) => {
        return client.eventStream({
            simulateState: true,
        }, (response) => {
            update((state) => {
                return applyEventStreamResponse(state, response)
            })
        }, (err) => {
            if (err) {
                console.error("error closing entity event stream", err);
            }
        });
    });
}

function applyEventStreamResponse(state: EntityMap, response: EventStreamResponse): EntityMap {
    switch (response.event.case) {
        case 'entityAdded': {
            const evt = response.event.value;
            console.debug("received entity added event", evt);
            const components: ComponentMap = new Map<string, Component>();
            for (const component of evt.components) {
                const cmp = anyUnpack(component, componentRegistry)
                if (cmp) {
                    components.set(cmp.$typeName, cmp);
                } else {
                    console.warn("unknown component any", component.typeUrl);
                }
            }
            state.set(evt.entityId, {
                id: evt.entityId,
                components: components,
            });
            return state;
        }

        case 'entityRemoved': {
            const evt = response.event.value;
            console.debug("received entity removed event", evt);
            state.delete(evt.entityId);
            return state;
        }

        case 'componentUpdated': {
            const evt = response.event.value;
            console.debug("received component updated event", evt);
            const ent = state.get(evt.entityId);
            if (ent && evt.component) {
                const cmp = anyUnpack(evt.component, componentRegistry)
                if (cmp) {
                    ent.components.set(cmp.$typeName, cmp);
                } else {
                    console.warn("unknown component any", evt.component.typeUrl);
                }
            }
            return state;
        }

        case 'componentRemoved': {
            const evt = response.event.value;
            console.debug("received component removed event", evt);
            const ent = state.get(evt.entityId);
            if (ent && evt.component) {
                const cmp = anyUnpack(evt.component, componentRegistry)
                if (cmp) {
                    ent.components.delete(cmp.$typeName);
                } else {
                    console.warn("unknown component any", evt.component.typeUrl);
                }
            }
            return state;
        }

        default:
            return state;
    }
}
