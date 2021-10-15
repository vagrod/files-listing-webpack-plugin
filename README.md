This plugin will generate output `json` file that contains a list of file paths found by a given criteria.

Installation:
```
npm install list-files-webpack-plugin --save-dev
```

Plugin options:

`outputFile`: `string`. Path to a resulted json file.\
`include`: Array of (`string`, `RegExp`, or `function()`) to filter the files in the resulted set.\
`exclude`: Optional. Array of (`string`, `RegExp`, or `function()`). One or more specifiers used to exclude assets from the resulted set.

`chunks`: Optional. Array of `string`. One or more chunk names whose corresponding output files should be included in the resulted set.\
`includeChunks`: Optional. Array of `string`. One or more chunk names whose corresponding output files should be included into the resulted set.\
`excludeChunks`: Optional. Array of `string`. One or more chunk names whose corresponding output files should be excluded from the resulted set.\
`verbose`: Optional. `boolean`. `true` to turn on the console output.

Usage:
```js
plugins: [
    new ListFilesPlugin(
        {
            verbose: true,
            outputFile: './dist/help-assets.json',
            include: [
                /help\/.*/
            ]
        }
    )        
]

// and on a client side somewhere:
fetch(`${process.env.BASE_URL}help-assets.json`)...
// .json() call on this fetch will return json array object containing all the files that satisfy the given "help\/.*" criteria.

```

It is useful, for example, in case you need to trigger recursive Service Worker caching of some app folder when a particular event has happened. For example, when user first time accesses app help, start caching the whole help contents in the background: to reduce app firts-time initialization and postpone caching of a cirtain things.

This plugin based on the [workbox-webpack-plugin](https://www.npmjs.com/package/workbox-webpack-plugin) code (`MIT` license), particularly from the `get-manifest-entries-from-compilation.js` lib.