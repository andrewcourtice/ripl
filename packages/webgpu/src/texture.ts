import type {
    Texture,
    TextureFilter,
    TextureWrap,
} from '@ripl/3d';

const WRAP_MODES: Record<TextureWrap, GPUAddressMode> = {
    clamp: 'clamp-to-edge',
    repeat: 'repeat',
    mirror: 'mirror-repeat',
};

const FILTER_MODES: Record<TextureFilter, GPUFilterMode> = {
    nearest: 'nearest',
    linear: 'linear',
};

interface TextureEntry {
    /** The version of the source texture this entry was uploaded from. */
    version: number;
    /** The uploaded GPU texture. */
    texture: GPUTexture;
    /** The bind group holding the texture view and its sampler. */
    bindGroup: GPUBindGroup;
}

/**
 * Uploads {@link Texture} images to the GPU and caches the bind groups built from them.
 *
 * Every draw binds group 2, textured or not: an untextured mesh gets a 1×1 opaque white fallback so
 * the pipeline layout never changes, which is what keeps the backend on a single pipeline rather
 * than one permutation per material.
 */
export class TextureManager {

    private _device: GPUDevice;
    private _layout: GPUBindGroupLayout;
    private _entries = new Map<string, TextureEntry>();
    private _fallback: TextureEntry | null = null;
    private _destroyed = false;

    /**
     * @param device - The device to allocate textures and samplers on.
     * @param layout - The bind group layout for group 2.
     */
    constructor(device: GPUDevice, layout: GPUBindGroupLayout) {
        this._device = device;
        this._layout = layout;
    }

    /**
     * Returns the bind group for a texture, uploading it if it is new or has changed.
     *
     * @param texture - The texture to bind, or `undefined` for the untextured fallback.
     * @returns The bind group to set at index 2.
     */
    public getBindGroup(texture: Texture | undefined): GPUBindGroup {
        if (this._destroyed) {
            throw new Error('Cannot bind a texture on a destroyed TextureManager.');
        }

        if (!texture || texture.width <= 0 || texture.height <= 0) {
            return this._getFallback().bindGroup;
        }

        const existing = this._entries.get(texture.id);

        if (existing && existing.version === texture.version) {
            return existing.bindGroup;
        }

        existing?.texture.destroy();

        const entry = this._upload(texture);

        this._entries.set(texture.id, entry);

        return entry.bindGroup;
    }

    /** Releases every uploaded texture, leaving the manager permanently inert. */
    public destroy(): void {
        this._destroyed = true;

        for (const entry of this._entries.values()) {
            entry.texture.destroy();
        }

        this._fallback?.texture.destroy();
        this._entries.clear();
        this._fallback = null;
    }

    private _upload(texture: Texture): TextureEntry {
        const width = texture.width;
        const height = texture.height;
        const gpuTexture = this._device.createTexture({
            size: [width, height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this._device.queue.copyExternalImageToTexture(
            {
                source: texture.source as GPUCopyExternalImageSource,
                flipY: texture.flipY,
            },
            {
                texture: gpuTexture,
            },
            [width, height]
        );

        return {
            version: texture.version,
            texture: gpuTexture,
            bindGroup: this._createBindGroup(gpuTexture, texture),
        };
    }

    private _createBindGroup(gpuTexture: GPUTexture, texture?: Texture): GPUBindGroup {
        const sampler = this._device.createSampler({
            addressModeU: WRAP_MODES[texture?.wrapS ?? 'repeat'],
            addressModeV: WRAP_MODES[texture?.wrapT ?? 'repeat'],
            magFilter: FILTER_MODES[texture?.magFilter ?? 'linear'],
            minFilter: FILTER_MODES[texture?.minFilter ?? 'linear'],
        });

        return this._device.createBindGroup({
            layout: this._layout,
            entries: [
                {
                    binding: 0,
                    resource: gpuTexture.createView(),
                },
                {
                    binding: 1,
                    resource: sampler,
                },
            ],
        });
    }

    // One opaque white texel, so an untextured mesh multiplies by 1 and the pipeline layout holds.
    private _getFallback(): TextureEntry {
        if (this._fallback) {
            return this._fallback;
        }

        const gpuTexture = this._device.createTexture({
            size: [1, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        this._device.queue.writeTexture(
            {
                texture: gpuTexture,
            },
            new Uint8Array([255, 255, 255, 255]),
            {
                bytesPerRow: 4,
            },
            [1, 1]
        );

        this._fallback = {
            version: -1,
            texture: gpuTexture,
            bindGroup: this._createBindGroup(gpuTexture),
        };

        return this._fallback;
    }

}
