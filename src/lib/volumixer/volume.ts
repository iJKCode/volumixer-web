import {type Transport, createClient} from "@connectrpc/connect";
import {VolumeService} from "volumixer-api/gen/ts/command/v1/volume_pb"

export function createVolumeClient(transport: Transport) {
    const client = createClient(VolumeService, transport)
    return {
        async setVolumeLevel(entity_id: string, level: number): Promise<void> {
            await client.setVolumeLevel({
                entityId: entity_id,
                level: level,
            })
        },
        async setVolumeMute(entity_id: string, mute: boolean): Promise<void> {
            await client.setVolumeMute({
                entityId: entity_id,
                mute: mute,
            })
        }
    }
}
