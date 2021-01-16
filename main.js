// Must be a .js file and not .ts
// or else it will error: `error: TS2339 [ERROR]: Property 'core' does not exist on type 'typeof Deno'.`
// justification: https://github.com/denoland/deno/issues/5525
// type definitions missing, at least noting that the example only works in JS and will fail to work in TS.

// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { decode, encode } from "https://deno.land/x/jpegts@1.1/mod.ts";

function resolveRustLibFilename(libName) {
  switch (Deno.build.os) {
    case "linux":
      return `lib${libName}.so`;
    case "darwin":
      return `lib${libName}.dylib`;
    case "windows":
      return `${libName}.dll`;
    default:
      throw new Error("unexpected operating system");
  }
}

const rid = Deno.openPlugin(
  `./rust-plugin/${resolveRustLibFilename("test_plugin")}`
);

const { helloWorld, testSync, testAsync, toGreyScale } = Deno.core.ops();
if (!(testSync > 0)) {
  throw "bad op id for testSync";
}
if (!(testAsync > 0)) {
  throw "bad op id for testAsync";
}
if (!(toGreyScale > 0)) {
  throw "bad op id for toGreyScale";
}

function runHelloWorld() {
  Deno.core.dispatch(helloWorld);
}

runHelloWorld();

async function runToGreyScale(file) {
  let raw = await Deno.readFile(`images/${file}`);

  const image = decode(raw);

  Deno.core.dispatch(toGreyScale, image.data);

  raw = encode(image, 100);

  await Deno.writeFile(`images/output/${file}`, raw.data);

  console.log(`images/${file} > greyScale > "images/output/${file}"`);
}

await runToGreyScale("dice.jpg");
await runToGreyScale("dino.jpg");

// const textDecoder = new TextDecoder();

// function runTestSync() {
//   const response = Deno.core.dispatch(
//     testSync,
//     new Uint8Array([116, 101, 115, 116]),
//     new Uint8Array([49, 50, 51]),
//     new Uint8Array([99, 98, 97])
//   );

//   console.log(`Plugin Sync Response: ${textDecoder.decode(response)}`);
// }

// Deno.core.setAsyncHandler(testAsync, (response) => {
//   console.log(`Plugin Async Response: ${textDecoder.decode(response)}`);
// });

// function runTestAsync() {
//   const response = Deno.core.dispatch(
//     testAsync,
//     new Uint8Array([116, 101, 115, 116]),
//     new Uint8Array([49, 50, 51])
//   );

//   if (response != null || response != undefined) {
//     throw new Error("Expected null response!");
//   }
// }

// function runTestOpCount() {
//   const start = Deno.metrics();

//   Deno.core.dispatch(testSync);

//   const end = Deno.metrics();

//   if (end.opsCompleted - start.opsCompleted !== 2) {
//     // one op for the plugin and one for Deno.metrics
//     throw new Error("The opsCompleted metric is not correct!");
//   }
//   if (end.opsDispatched - start.opsDispatched !== 2) {
//     // one op for the plugin and one for Deno.metrics
//     throw new Error("The opsDispatched metric is not correct!");
//   }
// }

// function runTestPluginClose() {
//   Deno.close(rid);

//   const resourcesPost = Deno.resources();

//   const preStr = JSON.stringify(resourcesPre, null, 2);
//   const postStr = JSON.stringify(resourcesPost, null, 2);
//   if (preStr !== postStr) {
//     throw new Error(
//       `Difference in open resources before openPlugin and after Plugin.close():
// Before: ${preStr}
// After: ${postStr}`
//     );
//   }
// }

// runTestSync();
// runTestAsync();

// runTestOpCount();
// runTestPluginClose();
