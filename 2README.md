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
