const fs = require('fs');
const path = require('path');
const { matchPart } = require('webpack').ModuleFilenameHelpers;

class ListFilesPlugin {
    options = {};

    constructor(opts = {}) {
        this.options = opts;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync(
            'FileListPlugin',
            (compilation, callback) => {
                if(this.options.verbose === true)
                    console.log(`\nFiles found for ${this.options.outputFile}:\n`);

                const assets = this.filterAssets(compilation, this.options)
                const result = [];
                for (const entry of assets) {
                    result.push(entry.name);
                    if(this.options.verbose === true)
                        console.log(entry.name);
                }

                fs.writeFile(
                    path.resolve(this.options.outputFile),
                    JSON.stringify(result),
                    'utf-8',
                    () => {
                        if(this.options.verbose === true)
                            console.log(`${this.options.outputFile} emitted.`);
                    }
                );

                callback();
            }
        );
    }

    getNamesOfAssetsInChunkOrGroup(compilation, chunkOrGroup) {
        const chunkGroup = compilation.namedChunkGroups && compilation.namedChunkGroups.get(chunkOrGroup);

        if (chunkGroup) {
            const assetNames = [];

            for (const chunk of chunkGroup.chunks) {
                assetNames.push(...this.getNamesOfAssetsInChunk(chunk));
            }

            return assetNames;
        } else {
            const chunk = compilation.namedChunks && compilation.namedChunks.get(chunkOrGroup);

            if (chunk) {
                return this.getNamesOfAssetsInChunk(chunk);
            }
        }

        return null;
    }

    getNamesOfAssetsInChunk(chunk) {
        const assetNames = [];
        assetNames.push(...chunk.files); // This only appears to be set in webpack v5.

        if (chunk.auxiliaryFiles) {
            assetNames.push(...chunk.auxiliaryFiles);
        }

        return assetNames;
    }

    checkConditions(asset, compilation, conditions = []) {
        for (const condition of conditions) {
            if (typeof condition === 'function') {
                if (condition({
                    asset,
                    compilation
                })) {
                    return true;
                }
            } else {
                if (matchPart(asset.name, condition)) {
                    return true;
                }
            }
        }

        return false;
    }

    filterAssets(compilation, config) {
        const filteredAssets = new Set();
        const assets = compilation.getAssets();
        const allowedAssetNames = new Set();

        if (Array.isArray(config.chunks)) {
            for (const name of config.chunks) {
                const assetsInChunkOrGroup = this.getNamesOfAssetsInChunkOrGroup(compilation, name);

                if (assetsInChunkOrGroup) {
                    for (const assetName of assetsInChunkOrGroup) {
                        allowedAssetNames.add(assetName);
                    }
                } else {
                    compilation.warnings.push(new Error(`The chunk '${name}' was provided in your Workbox chunks config, but was not found in the compilation.`));
                }
            }
        }

        const deniedAssetNames = new Set();

        if (Array.isArray(config.excludeChunks)) {
            for (const name of config.excludeChunks) {
                const assetsInChunkOrGroup = this.getNamesOfAssetsInChunkOrGroup(compilation, name);

                if (assetsInChunkOrGroup) {
                    for (const assetName of assetsInChunkOrGroup) {
                        deniedAssetNames.add(assetName);
                    }
                }
            }
        }

        for (const asset of assets) {
            if (deniedAssetNames.has(asset.name)) {
                continue;
            }

            if (Array.isArray(config.chunks) && !allowedAssetNames.has(asset.name)) {
                continue;
            }

            const isExcluded = this.checkConditions(asset, compilation, config.exclude);

            if (isExcluded) {
                continue;
            }

            const isIncluded = !Array.isArray(config.include) || this.checkConditions(asset, compilation, config.include);

            if (!isIncluded) {
                continue;
            }

            filteredAssets.add(asset);
        }

        return filteredAssets;
    }
}

module.exports = ListFilesPlugin;