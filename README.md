# Deno image transform

Deno plugin to transform images using a plugin.

alex notes:
- no ts, no type definitions because its unstable and might change
- mac and windows
- rust compiles to different stuff depending on the OS
- benchmark performance rust vs deno (js-only vs plugin)
- containerize
  - cargo has a trick (doesn’t rebuild because of timestamp)
- sync vs async
  - async stops the world, sync does things
  - async api will change to make calls more related to each other



  --------


# How to run

- Install Deno
- `deno run --allow-read mod.ts`

// Must be a .js file and not .ts
// or else it will error: `error: TS2339 [ERROR]: Property 'core' does not exist on type 'typeof Deno'.`
// justification: https://github.com/denoland/deno/issues/5525
// type definitions missing, at least noting that the example only works in JS and will fail to work in TS.

# .js ready for multiple OS (window linux, osx)

# Hello world

# parameter & return enconding
https://crates.io/crates/deno_json_op

# to grey scale

# benchmark
deno js delay

# Async
sync ops do stop the world example
async fix

# conclusion

















- story
  - image manipulation plugin
  - grayscale
  - hello world
    - rust (hello wold)
    - register op
    - js
      - load plugin
      - dispatch with op
  - send text
    - zerocopy u8 parameters
    - string encode and decode
    - OP how to send a value back explain sync
    - send parameters encoded from js
    - encode/decode and log response
  - send json
    - send image
    - first param image config
    - textencoder
    - send metadata first
    - js
      - last parameter array of bytes
      - serde_json get json of metadata from deno
      - get alpha channel (pattern matching)
      - show params
      - new json with success
      - json to vec
      - op sync with array of bytes
  - json with image
    - send array of bytes to performance
    - read file on deno
    - decode
    - encode first param and send second as is
    - rust
      - pixel size
      - copy zero_copy
      - get array as mutable
      - sleep 2 seconds to simulate a slow execution time
      - call to grayscale
      - return sync
      - grayscale = average of rgb
    - js
      - encode image
      - write to file
      - side by side before/after
    - execute
      - explain logs
  - show time is slow
    - call to grayscale without promise await
    - sleep for 5 seconds and await for infal promise
    - explain that rust blocks the thread and stops the world
  - how to solve this
    - async
    - link PR about async ops dispatch (evolving)
      - promise is async
      - otherwise it isn't (future)
    - get call id
    - save the pending op
    - due to isntability
      - op id to setAsyncHandler (opId instead of pluginId)
      - called when op is finished
      - decode
      - get call id and promise
      - resolve promise
      - try catch for handlers that die
    - call core dispatch with generted call id
    - do not care about result
    - wait for rust op
    - everything is similar
    - rust
      - get call id
      - everything the same
      - clone argument to not mutate original thing
      - clone doesn't clone the content, created a new rust
      - async block that's returned to the async func
      - sleep
      - transform array to grayscale
      - result has a call id
      - create thread?
    - js
      -get async result
  - async is real async without stopping
    - start things
    - write stuff to the console
    - await later
    - without thread
  - async with thread
  - docker build trick for CI
    - bonus caching things
- gotchas
  - unstable
  - type definition
  - different paths OS
  - lack of api documentation




  