import { assertEquals } from "@std/assert";
import { colorize } from "./mod.ts";

Deno.test("colorize - applies basic color to text", () => {
  const coloredRed = colorize("some <🔴>red</🔴> text");
  console.log("coloredRed", coloredRed);
  assertEquals(coloredRed, "some \x1b[31mred\x1b[0m text");
});

Deno.test("colorize - applies bold and color separately", () => {
  const boldRedBrick = colorize("some <🧱><🔴>red</🔴></🧱> text");
  
});

Deno.test("colorize - applies bold color using single emoji", () => {
  const boldRedSquare = colorize("some <🟥>red</🟥> text");

});

