import { decode } from "./decoder.js";

const file = await Deno.readFile("./image.jpeg");

console.log(decode(file, { useTArray: true }));
