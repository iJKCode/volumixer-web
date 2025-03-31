import type {Transport} from '@connectrpc/connect';
import {createConnectTransport} from '@connectrpc/connect-web';
import {componentRegistry} from '$lib/volumixer/component';

export function createTransport(url: string = 'http://localhost:5000/'): Transport {
    return createConnectTransport({
        baseUrl: url,
        jsonOptions: {
            registry: componentRegistry,
        }
    })
}
