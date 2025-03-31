import {type Transport} from '@connectrpc/connect';
import {type Any, anyUnpack} from "@bufbuild/protobuf/wkt";
import {type Message, createRegistry} from '@bufbuild/protobuf';
import {createConnectTransport} from '@connectrpc/connect-web';

import {file_widget_v1_info} from 'volumixer-api/gen/ts/widget/v1/info_pb';
import {file_widget_v1_volume} from 'volumixer-api/gen/ts/widget/v1/volume_pb';

export const registry = createRegistry(
    file_widget_v1_info,
    file_widget_v1_volume,
);

export function createTransport(url: string = 'http://localhost:5000/'): Transport {
    return createConnectTransport({
        baseUrl: url,
        useBinaryFormat: true,
    })
}

export function unpackAny(any: Any): Message | undefined {
    return anyUnpack(any, registry)
}
