import { assertEquals } from "@std/assert";
import { colorize } from "./mod.ts";
import { MAP_EMOJI_TO_ANSI } from "./mod.ts";

console.log("<⚓️> underlined </⚓️>");
console.log(colorize("<⚓️> underlined </⚓️>"));

Deno.test("colorize - applies basic color to text", () => {
  const input = "some <🔴>red</🔴> text";
  const coloredRed = colorize(input);
  const codeRed = MAP_EMOJI_TO_ANSI["🔴"];
  const RESET = "\x1b[0m";
  const expected = `some ${codeRed}red${RESET} text`;
  assertEquals(coloredRed, expected);
});

Deno.test("colorize - applies bold and color separately", () => {
  const input = "some <🧱>bold white and <🔴>bold red</🔴></🧱> text";
  const boldRedBrick = colorize(input);
  const codeBold = MAP_EMOJI_TO_ANSI["🧱"];
  const codeRed = MAP_EMOJI_TO_ANSI["🔴"];
  const RESET = "\x1b[0m";
  const expected =
    `some ${codeBold}bold white and ${codeRed}bold red${RESET}${codeBold}${RESET} text`;
  assertEquals(boldRedBrick, expected);
  console.log("result:", expected);
});

Deno.test("colorize - applies bold color using single emoji", () => {
  const input = "some <🟥>bold red</🟥> text";
  const boldRedSquare = colorize(input);
  const codeBoldRed = MAP_EMOJI_TO_ANSI["🟥"];
  const RESET = "\x1b[0m";
  const expected = `some ${codeBoldRed}bold red${RESET} text`;
  assertEquals(boldRedSquare, expected);
  console.log("result:", expected);
});

Deno.test("colorize - more complex structures", () => {
  const input =
    "some <🔳>underlined text</🔳> followed by some <🧱>bold white and <🔴>bold red</🔴></🧱> text";
  const complex = colorize(input);

  const codeUnderline = MAP_EMOJI_TO_ANSI["⚓️"];
  const codeBold = MAP_EMOJI_TO_ANSI["🧱"];
  const codeRed = MAP_EMOJI_TO_ANSI["🔴"];
  const RESET = "\x1b[0m";

  const expected =
    `some ${codeUnderline}underlined text${RESET} followed by some ` +
    `${codeBold}bold white and ${codeRed}bold red${RESET}${codeBold}${RESET} text`;
  assertEquals(complex, expected);
  console.log("result:", expected);
});

const RESET = "\x1b[0m";

Deno.test("plain text remains unchanged", () => {
  const input = "just some plain text";
  const output = colorize(input);
  assertEquals(output, "just some plain text");
});

Deno.test("single color tag wraps text in correct ANSI codes", () => {
  const input = `<🔴>hello</🔴>`;
  const expected = `${MAP_EMOJI_TO_ANSI["🔴"]}hello${RESET}`;
  assertEquals(colorize(input), expected);
  console.log("result:", expected);
});

Deno.test("nested color tags reapply parent after inner reset", () => {
  const codeRed = MAP_EMOJI_TO_ANSI["🔴"];
  const codeBlue = MAP_EMOJI_TO_ANSI["🔵"];

  const input = `<🔴>red <🔵>blue</🔵> still red</🔴>`;

  // Breakdown:
  // 1. Apply red: codeRed
  // 2. "red "
  // 3. Apply blue: codeBlue
  // 4. "blue"
  // 5. RESET resets both; reapply red: codeRed
  // 6. " still red"
  // 7. Final RESET to clear red
  const expected = codeRed +
    "red " +
    codeBlue +
    "blue" +
    RESET +
    codeRed +
    " still red" +
    RESET;

  assertEquals(colorize(input), expected);
  console.log("result:", expected);
});

Deno.test("bold control character works", () => {
  const codeBold = MAP_EMOJI_TO_ANSI["🧱"];
  const input = `<🧱>very bold</🧱>`;
  const expected = `${codeBold}very bold${RESET}`;
  assertEquals(colorize(input), expected);
  console.log("result:", expected);
});

Deno.test("'cyan' and '🥶' are equivalent", () => {
  const input = "<cyan>cyan</cyan> is the same as <🥶>cyan</🥶>";
  const expected = `${MAP_EMOJI_TO_ANSI["🥶"]}cyan${RESET} is the same as ${
    MAP_EMOJI_TO_ANSI["🥶"]
  }cyan${RESET}`;
  assertEquals(colorize(input), expected);
  console.log("result:", expected);
});

Deno.test("'🔳' and 'underline' are equivalent", () => {
  const input =
    "<🔳>underlined</🔳> is the same as <underline>underlined</underline>";
  const expected = `${
    MAP_EMOJI_TO_ANSI["🔳"]
  }underlined${RESET} is the same as ${
    MAP_EMOJI_TO_ANSI["underline"]
  }underlined${RESET}`;
  assertEquals(colorize(input), expected);
  console.log("result:", expected);
});

Deno.test("unknown tags render literally", () => {
  const input = "<unknown>should stay <nested>as-is</nested></unknown>";
  const output = colorize(input);
  assertEquals(output, "<unknown>should stay <nested>as-is</nested></unknown>");
  console.log("result:", output);
});
