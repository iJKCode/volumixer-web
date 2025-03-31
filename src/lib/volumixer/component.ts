import { createRegistry } from '@bufbuild/protobuf';
import { file_widget_v1_info } from 'volumixer-api/gen/ts/widget/v1/info_pb';
import { file_widget_v1_volume } from 'volumixer-api/gen/ts/widget/v1/volume_pb';

export const componentRegistry = createRegistry(
    file_widget_v1_info,
    file_widget_v1_volume,
);
