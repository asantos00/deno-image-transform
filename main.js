// Rust plugin interaction must be done in a .js file and not .ts
// or else it will error: `error: TS2339 [ERROR]: Property 'core' does not exist on type 'typeof Deno'.`
// justification: https://github.com/denoland/deno/issues/5525
// type definitions missing, at least noting that the example only works in JS and will fail to work in TS.
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

const rustLibFilename = resolveRustLibFilename("test_plugin");
const rustPluginId = Deno.openPlugin(`./rust-plugin/${rustLibFilename}`);

const {
  helloWorld,
  testTextParamsAndReturn,
  testJsonParamsAndReturn,
  toGreyScale,
  toGreyScaleAsync,
} = Deno.core.ops();
if (!(helloWorld > 0)) {
  throw "bad op id for helloWorld";
}
if (!(testTextParamsAndReturn > 0)) {
  throw "bad op id for testTextParamsAndReturn";
}
if (!(testJsonParamsAndReturn > 0)) {
  throw "bad op id for testJsonParamsAndReturn";
}
if (!(toGreyScale > 0)) {
  throw "bad op id for toGreyScale";
}
if (!(toGreyScaleAsync > 0)) {
  throw "bad op id for toGreyScaleAsync";
}

console.log("---------- hello world:");

function runHelloWorld() {
  Deno.core.dispatch(helloWorld);
}

runHelloWorld();

console.log("\n---------- text params and return:");

function runTestTextParamsAndReturn() {
  const textEncoder = new TextEncoder();
  const param0 = textEncoder.encode("text");
  const param1 = textEncoder.encode("sent from");
  const param2 = textEncoder.encode("deno");

  const response = Deno.core.dispatch(
    testTextParamsAndReturn,
    param0,
    param1,
    param2
  );

  const textDecoder = new TextDecoder();
  const result = textDecoder.decode(response);
  console.log(`Deno: result: ${result}`);
}

runTestTextParamsAndReturn();

console.log("\n---------- json params and return:");

function runTestJsonParamsAndReturn() {
  const textEncoder = new TextEncoder();
  const image = {
    hasAlphaChannel: true,
    size: {
      width: 100,
      height: 50,
    },
  };
  const param0 = textEncoder.encode(JSON.stringify(image));

  const response = Deno.core.dispatch(testJsonParamsAndReturn, param0);

  const textDecoder = new TextDecoder();
  const result = textDecoder.decode(response);
  console.log(`Deno: result: ${result}`);
  const jsonResult = JSON.parse(result);
  console.log(`Deno: jsonResult.success: ${jsonResult.success}`);
}

runTestJsonParamsAndReturn();

console.log("\n---------- toGreyScale:");

async function runToGreyScale(inputFilename, outputFilename) {
  // let raw = await Deno.readFile(`images/${file}`);
  // Using the sync version of readFile to help highlight the `Deno.core.dispatch` not returning until the sync rust op is finished, effectively stoping deno's world.
  let raw = Deno.readFileSync(`images/${inputFilename}`);
  const image = decode(raw);
  const textEncoder = new TextEncoder();
  const imageDescriptor = {
    hasAlphaChannel: true,
    size: {
      width: image.width,
      height: image.height,
    },
  };
  const param0 = textEncoder.encode(JSON.stringify(imageDescriptor));
  const param1 = image.data;

  Deno.core.dispatch(toGreyScale, param0, param1);

  raw = encode(image, 100);

  await Deno.writeFile(`images/output/${outputFilename}`, raw.data);

  console.log(
    `Deno: runToGreyScale(\"images/${inputFilename}\") > "images/output/${outputFilename}"`
  );
}

await runToGreyScale("dice.jpg", "dice.jpg");
await runToGreyScale("dino.jpg", "dino.jpg");

console.log("\n---------- toGreyScale hangs deno?:");

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function runToGreyScaleHangTest() {
  const toGreyScalePromise = runToGreyScale("dice.jpg", "hang-dice.jpg");

  console.log(
    "Deno: runToGreyScale() started, will try to do other stuff meanwhile"
  );

  for (let i = 0; i < 5; ++i) {
    console.log(
      "Deno: sleeping for 200 ms (pretending to do something in parallel of runToGreyScale())"
    );
    await sleep(200);
  }

  await toGreyScalePromise;
}

await runToGreyScaleHangTest();

console.log("\n---------- toGreyScaleAsync:");

let lastCallId = 0;

function generateNewCallId() {
  return ++lastCallId;
}

const rustPendingOps = {};

async function waitForRustOp(opId, callId) {
  let opPendingCalls = rustPendingOps[opId];

  if (!opPendingCalls) {
    registerOpAsyncHandler(opId);
    rustPendingOps[opId] = opPendingCalls = {};
  }

  let call = opPendingCalls[callId];

  if (!call) {
    opPendingCalls[callId] = call = {};
    call.promise = new Promise((resolve, reject) => {
      call.resolve = resolve;
      call.reject = reject;
    });
  }

  return call.promise;
}

function registerOpAsyncHandler(opId) {
  Deno.core.setAsyncHandler(opId, (msg) => {
    try {
      const textDecoder = new TextDecoder();
      const result = textDecoder.decode(msg);
      const jsonResult = JSON.parse(result);
      const callId = jsonResult.callId;

      if (callId == undefined || callId == null) {
        throw new Error(`unable to read callId`);
      }

      const call = rustPendingOps[opId][callId];

      if (!call) {
        throw new Error(`unknown event, id: '${callId}'`);
      }

      call.resolve(jsonResult);
    } catch (ex) {
      console.warn("Deno.core.setAsyncHandler(): handler warning:", ex);
    }
  });
}

async function runToGreyScaleAsync(inputFilename, outputFilename) {
  // let raw = await Deno.readFile(`images/${file}`);
  // Using the sync version of readFile to help highlight the `Deno.core.dispatch` not returning until the sync rust op is finished, effectively stoping deno's world.
  let raw = Deno.readFileSync(`images/${inputFilename}`);
  const image = decode(raw);
  const textEncoder = new TextEncoder();
  const imageDescriptor = {
    callId: generateNewCallId(),
    hasAlphaChannel: true,
    size: {
      width: image.width,
      height: image.height,
    },
  };
  const param0 = textEncoder.encode(JSON.stringify(imageDescriptor));
  const param1 = image.data;

  Deno.core.dispatch(toGreyScaleAsync, param0, param1);

  await waitForRustOp(toGreyScaleAsync, imageDescriptor.callId);

  raw = encode(image, 100);

  await Deno.writeFile(`images/output/${outputFilename}`, raw.data);

  console.log(
    `Deno: runToGreyScale(\"images/${inputFilename}\") > "images/output/${outputFilename}"`
  );
}

await Promise.all([
  runToGreyScaleAsync("dice.jpg", "async-dice.jpg"),
  runToGreyScaleAsync("dino.jpg", "async-dino.jpg"),
]);

console.log("\n---------- toGreyScaleAsync hangs deno?:");

async function runToGreyScaleAsyncHangTest() {
  const toGreyScalePromise = runToGreyScaleAsync(
    "dice.jpg",
    "async-hang-dice.jpg"
  );

  console.log(
    "Deno: runToGreyScaleAsync() started, will try to do other stuff meanwhile"
  );

  for (let i = 0; i < 5; ++i) {
    console.log(
      "Deno: sleeping for 200 ms (pretending to do something in parallel of runToGreyScaleAsync())"
    );
    await sleep(200);
  }

  await toGreyScalePromise;
}

await runToGreyScaleAsyncHangTest();
