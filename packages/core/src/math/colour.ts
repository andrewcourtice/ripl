export function hexToRgb(value?: string | null): [red: number, green: number, blue: number] {
    const components = value && /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(value);

    if (!components) {
        return [255, 255, 255];
    }

    return [
        parseInt(components[1], 16),
        parseInt(components[2], 16),
        parseInt(components[3], 16),
    ];
}

export function channelToHex(channel: number): string {
    const hex = channel.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(red: number, green: number, blue: number): string {
    return `#${channelToHex(red) + channelToHex(green) + channelToHex(blue)}`;
}

export function blendHex(hexA: string, hexB: string, factor: number): string {
    const rgbA = hexToRgb(hexA);
    const rgbB = hexToRgb(hexB);

    const mixChannel = (valueA: number, valueB: number) => {
        return Math.round(valueA * (1 - factor) + valueB * factor);
    };

    return rgbToHex(
        mixChannel(rgbA[0], rgbB[0]),
        mixChannel(rgbA[1], rgbB[1]),
        mixChannel(rgbA[2], rgbB[2])
    );
}