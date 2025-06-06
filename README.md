# @polyseam/emoji-ansi-colorizer

A minimal TypeScript/JavaScript library that converts emoji-wrapped tags into
ANSI escape codes for colorful terminal output. The core export is the
`colorize` function—everything else is provided for convenience and discovery.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Example](#basic-example)
  - [Nested Styles](#nested-styles)
  - [Control Characters](#control-characters)
- [API Reference](#api-reference)
- [Supported Emoji Tags](#supported-emoji-tags)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Use intuitive emoji markers (e.g. `<🔴>…</🔴>`) to wrap text, and let `colorize`
translate them into proper ANSI codes. This makes it easy to add colors, bold,
intensity, or underline to terminal output without memorizing escape sequences.

```ts
import { colorize } from "@polyseam/emoji-ansi-colorizer";

console.log(colorize("Server started at <🟢>Port 8080</🟢>"));
```

All other constants (emoji names and the emoji-to-ANSI mapping) are exported
primarily so you can inspect or discover available tags, but they are not
required to use the library. Your code will usually just call `colorize(...)`.

---

## Installation

```sh
npm install @polyseam/emoji-ansi-colorizer
# or if using Deno (import directly)
import { colorize } from "jsr:@polyseam/emoji-ansi-colorizer";
```

---

## Usage

### Basic Example

Wrap any substring with an opening and closing emoji tag. The `colorize`
function finds these tags and replaces them with their ANSI codes:

```ts
import { colorize } from "@polyseam/emoji-ansi-colorizer";

const msg = "Warning: <🔴>Disk space low</🔴>";
console.log(colorize(msg));
// In a terminal, “Disk space low” appears in red.
```

### Nested Styles

You can nest tags. When an inner tag closes (which implicitly sends a full
reset), the parent’s style is reapplied automatically:

```ts
import { colorize } from "@polyseam/emoji-ansi-colorizer";

const nestedExample = colorize(
  `<🔴>Error: <🔵>Code 500</🔵> encountered</🔴>`,
);
console.log(nestedExample);
// 1. Apply red → “Error: ”
// 2. Apply blue → “Code 500”
// 3. RESET → reapply red → “ encountered”
// 4. RESET
```

### Control Characters

In addition to color tags, there are standalone emoji tags for:

- **Bold** (🧱)
- **High Intensity (Bright)** (✨)
- **Underline** (⚓️)

```ts
import { colorize } from "@polyseam/emoji-ansi-colorizer";

console.log(colorize(`<🧱>Important</🧱>`));
// → “Important” in bold

console.log(colorize(`and <⚓️>Don't Forget</⚓️> to save your work!`));
// → “Don't Forget” underlined

console.log(colorize(`<✨>Notice</✨> the beauty`));
// → “Notice” in bright (high intensity) style
```

---

## API Reference

### `colorize(input: string): string`

The single-function entry point. Parses the input string for emoji-based
open/close tags and emits a string with proper ANSI escape codes.

**Parameters**:

- `input` (`string`): A string containing zero or more emoji-wrapped segments.\
  Example: `"Hello <🔵>world</🔵>!"`.

**Returns**:

- (`string`): The same text, but with all recognized emoji tags replaced by
  their ANSI codes, with nested styles preserved.

---

## Supported Emoji Tags

| Emoji |       Description       |  ANSI Code   |
| :---: | :---------------------: | :----------: |
|  ⚫   |          Black          |  `\x1b[30m`  |
|  🔴   |           Red           |  `\x1b[31m`  |
|  🟢   |          Green          |  `\x1b[32m`  |
|  🟡   |         Yellow          |  `\x1b[33m`  |
|  🔵   |          Blue           |  `\x1b[34m`  |
|  🟣   |         Magenta         |  `\x1b[35m`  |
|  🥶   |          Cyan           |  `\x1b[36m`  |
|  ⚪   |          White          |  `\x1b[37m`  |
|  ⬛️   |      Black (bold)       | `\x1b[1;30m` |
|  🟥   |       Red (bold)        | `\x1b[1;31m` |
|  🟩   |      Green (bold)       | `\x1b[1;32m` |
|  🟨   |      Yellow (bold)      | `\x1b[1;33m` |
|  🟦   |       Blue (bold)       | `\x1b[1;34m` |
|  🟪   |     Magenta (bold)      | `\x1b[1;35m` |
|  🧊   |       Cyan (bold)       | `\x1b[1;36m` |
|  ⬜️   |      White (bold)       | `\x1b[1;37m` |
|  🧱   |          Bold           |  `\x1b[1m`   |
|  ✨   | High Intensity (Bright) |  `\x1b[1m`   |
|  ⚓️   |        Underline        |  `\x1b[4m`   |

_(See the full list in source code.)_

---

## Testing

Unit tests use Deno’s built-in test runner. To run:

```sh
deno test --allow-read
```

You’ll see tests that verify:

1. Plain text remains unchanged.
2. Single emoji tags wrap text correctly.
3. Nested tags reapply parent styles.
4. Control-character tags (bold, underline, intensity) behave as expected.
5. Unknown tags are rendered literally.

---

## Contributing

Contributions are welcome—especially around the `colorize` function’s parsing
logic or adding new emoji-to-ANSI mappings.

1. Fork the repo.
2. Create a feature branch:
   ```sh
   git checkout -b feature/your-descriptor
   ```
3. Implement or update code, add tests as needed.
4. Run tests:
   ```sh
   deno test --allow-read
   ```
5. Commit & push.
6. Open a Pull Request against `main`.

---

## License

[Apache-2.0](LICENSE)
