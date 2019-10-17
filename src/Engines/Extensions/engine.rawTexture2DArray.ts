import { Nullable } from "../../types";
import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Constants } from '../constants';
import { Engine } from '../engine';

declare module "../../Engines/engine" {
    export interface Engine {
        /**
         * Creates a new raw 2D array texture
         * @param data defines the data used to create the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the number of layers of the texture
         * @param format defines the format of the texture
         * @param generateMipMaps defines if the engine must generate mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compressed used (can be null)
         * @param textureType defines the compressed used (can be null)
         * @returns a new raw 2D array texture (stored in an InternalTexture)
         */
        createRawTexture2DArray(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string>, textureType: number): InternalTexture;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture2DArray(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture2DArray(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, textureType: number): void;
    }
}

Engine.prototype.createRawTexture2DArray = function(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
    var texture = new InternalTexture(this, InternalTextureSource.Raw2DArray);
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.baseDepth = depth;
    texture.width = width;
    texture.height = height;
    texture.depth = depth;
    texture.format = format;
    texture.type = textureType;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    texture.is2DArray = true;

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }

    this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);
    this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, texture, true);

    // Filters
    var filters = this._getSamplingParameters(samplingMode, generateMipMaps);

    this._gl.texParameteri(this._gl.TEXTURE_2D_ARRAY, this._gl.TEXTURE_MAG_FILTER, filters.mag);
    this._gl.texParameteri(this._gl.TEXTURE_2D_ARRAY, this._gl.TEXTURE_MIN_FILTER, filters.min);

    if (generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D_ARRAY);
    }

    this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, null);

    this._internalTexturesCache.push(texture);

    return texture;
};

Engine.prototype.updateRawTexture2DArray = function(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
    var internalType = this._getWebGLTextureType(textureType);
    var internalFormat = this._getInternalFormat(format);
    var internalSizedFomat = this._getRGBABufferInternalSizedFormat(textureType, format);

    this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, texture, true);
    this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
    }

    if (texture.width % 4 !== 0) {
        this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
    }

    if (compression && data) {
        this._gl.compressedTexImage3D(this._gl.TEXTURE_2D_ARRAY, 0, (<any>this.getCaps().s3tc)[compression], texture.width, texture.height, texture.depth, 0, data);
    } else {
        this._gl.texImage3D(this._gl.TEXTURE_2D_ARRAY, 0, internalSizedFomat, texture.width, texture.height, texture.depth, 0, internalFormat, internalType, data);
    }

    if (texture.generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D_ARRAY);
    }
    this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, null);
    // this.resetTextureCache();
    texture.isReady = true;
};
