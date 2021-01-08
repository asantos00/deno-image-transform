const pluginPath = "./target/debug/libdeno_plugin_example.so"
const plugin = Deno.openPlugin(pluginPath);
const { testSync, testAsync } = plugin.ops;

// Dispatch synchronous operation. Arguments and response are `Uint8Array`
const syncResp: Uint8Array = testSync.dispatch(new Uint8Array([0,1,2,3]));
const asyncResp = await new Promise<Uint8Array>(resolve => {
  // Register handler for async oeration
  testAsync.setAsyncHandler((resp: Uint8Array) => {
    // do stuff
    resolve(resp);
  })
  // Dispatch async operation with argument
  testAsync.dispatch(new Uint8Array([0,1,2,3]))
});
