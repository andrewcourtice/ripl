/**
 * Converts a base64 data URL into a {@link Blob} synchronously.
 *
 * Canvas-backed contexts already hold a data URL by the time they build a {@link ContextExport},
 * and the async `canvas.toBlob` would make every exporter a promise for no gain — this decodes the
 * base64 payload in place instead. A URL carrying no recognisable MIME type is treated as
 * `image/png`, which is what every caller here produces.
 *
 * @param dataURL - The `data:` URL to decode.
 * @returns A blob holding the URL's decoded bytes.
 */
export function dataURLToBlob(dataURL: string): Blob {
    const [header, data] = dataURL.split(',');
    const mimeMatch = /:(.*?);/.exec(header);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], {
        type: mime,
    });
}
