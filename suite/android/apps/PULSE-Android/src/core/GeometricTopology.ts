export interface DeviceAnchor {
    id: string;
    protocol: 'MDNS_AIRPLAY' | 'MDNS_CAST' | 'UPNP_SONOS' | 'BLUETOOTH' | 'OPTICAL';
    role: 'PRIMARY_VIDEO' | 'PRIMARY_AUDIO' | 'AUX_AUDIO' | 'WITNESS';
    ip: string;
    hwVersion?: 'S1' | 'S2'; // S1 lacks Media Server, S2 exposes Media Server
}

export interface SpaceEntity {
    id: string;
    semanticName: string;
    anchors: DeviceAnchor[];
}

export const SOVEREIGN_TOPOLOGY: Record<string, SpaceEntity> = {
    'indoor.end_room': {
        id: 'indoor.end_room',
        semanticName: 'End Room',
        anchors: [
            { id: 'apple_tv_end_room', protocol: 'MDNS_AIRPLAY', role: 'PRIMARY_VIDEO', ip: '72DEC9402E06:End Room.local' },
            { id: 'polk_magnifi', protocol: 'MDNS_CAST', role: 'PRIMARY_AUDIO', ip: '192.168.86.248' },
            { id: 'b_and_o_pulse', protocol: 'MDNS_AIRPLAY', role: 'WITNESS', ip: 'f2e891c40501:@_PULSE.local' },
            { id: 'sonos_five', protocol: 'UPNP_SONOS', role: 'AUX_AUDIO', ip: '192.168.86.44', hwVersion: 'S1' } // Changed ID to sonos_five, marked S1
        ]
    },
    'indoor.family_room': {
        id: 'indoor.family_room',
        semanticName: 'Family Room',
        anchors: [
            { id: 'sonos_ray', protocol: 'UPNP_SONOS', role: 'PRIMARY_AUDIO', ip: '192.168.86.36', hwVersion: 'S2' } // Using the IP we found earlier for S2
        ]
    }
};
