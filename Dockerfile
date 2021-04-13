FROM rust:1.49.0-buster@sha256:cf80a77b3c4b1717558c1757bfdfb8ac347cd6da2e9ecaeedc94f30dd23bf31f AS rust

WORKDIR /deno

# Cache rust dependencies (download and compile):
COPY rust-plugin/Cargo.* rust-plugin/
RUN mkdir -p rust-plugin/src && \
  echo "// dummy file" > rust-plugin/src/lib.rs && \
  cd rust-plugin && \
  cargo build

COPY rust-plugin/src/ rust-plugin/src/
COPY Makefile Makefile
# `touch` is required because of https://github.com/rust-lang/cargo/issues/7982
RUN touch rust-plugin/src/lib.rs && \
  make rust-build

FROM hayd/debian-deno:1.6.2@sha256:7180ef661ea29d697f9ad667bb691dfbf36b34b2fc1d7459b8ece752dbc77201 AS deno

RUN apt-get update && \
  apt-get install make=4.2.1-1.2 -y

WORKDIR /deno
COPY --from=rust /deno/rust-plugin/libtest_plugin.so ./rust-plugin/libtest_plugin.so
COPY images/ images/
COPY main.js main.js
COPY Makefile Makefile

CMD ["make", "deno-run"]
