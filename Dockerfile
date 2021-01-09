FROM rust:1.49.0-buster@sha256:cf80a77b3c4b1717558c1757bfdfb8ac347cd6da2e9ecaeedc94f30dd23bf31f AS rust

RUN git clone https://github.com/denoland/deno.git && \
    cd deno && \
    git checkout 43618954766a2ba525541501422bb6e7d5ccc913
WORKDIR /deno/test_plugin
RUN cargo build

FROM hayd/debian-deno:1.6.2@sha256:7180ef661ea29d697f9ad667bb691dfbf36b34b2fc1d7459b8ece752dbc77201 AS deno

WORKDIR /deno_plugin_example
COPY --from=rust /deno/target/debug/libtest_plugin.so ./libtest_plugin.so
COPY main.js main.js

CMD ["deno", "run", "--unstable", "--allow-plugin", "main.js"]
