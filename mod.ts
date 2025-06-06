type Node =
  | { type: "text"; content: string }
  | { type: "tag"; name: string; children: Node[] };

// standard colors (primary emoji)
export const EMOJI_BLACK = "⚫";
export const EMOJI_RED = "🔴";
export const EMOJI_GREEN = "🟢";
export const EMOJI_YELLOW = "🟡";
export const EMOJI_BLUE = "🔵";
export const EMOJI_MAGENTA = "🟣";
export const CYAN_EMOJI = "🥶";
export const WHITE_EMOJI = "⚪";

// bold colors (secondary emoji)
export const EMOJI_BOLD_BLACK = "⬛️";
export const EMOJI_BOLD_RED = "🟥";
export const EMOJI_BOLD_GREEN = "🟩";
export const EMOJI_BOLD_YELLOW = "🟨";
export const EMOJI_BOLD_BLUE = "🟦";
export const EMOJI_BOLD_MAGENTA = "🟪";
export const EMOJI_BOLD_CYAN = "🧊";
export const EMOJI_BOLD_WHITE = "⬜";

// dedicated control characters (tertiary emoji)
export const EMOJI_BOLD = "🧱";
export const EMOJI_HIGH_INTENSITY = "✨";
export const EMOJI_UNDERLINE = "🔳";

/**
 * Define ANSI code strings, each associated with a list of aliases.
 * You can freely add more string aliases (like "red", "r", "error", etc.)
 * to the array for each ANSI code.
 */
const ANSI_ALIAS_MAP: Record<string, string[]> = {
  // standard (non-bold) colors
  "\x1b[30m": [EMOJI_BLACK, "black"],
  "\x1b[31m": [EMOJI_RED, "red", "r"],
  "\x1b[32m": [EMOJI_GREEN, "green", "g"],
  "\x1b[33m": [EMOJI_YELLOW, "yellow", "y"],
  "\x1b[34m": [EMOJI_BLUE, "blue", "b"],
  "\x1b[35m": [EMOJI_MAGENTA, "magenta", "m"],
  "\x1b[36m": [CYAN_EMOJI, "cyan", "c"],
  "\x1b[37m": [WHITE_EMOJI, "white", "w"],

  // bold colors
  "\x1b[1;30m": [EMOJI_BOLD_BLACK, "bold-black"],
  "\x1b[1;31m": [EMOJI_BOLD_RED, "bold-red"],
  "\x1b[1;32m": [EMOJI_BOLD_GREEN, "bold-green"],
  "\x1b[1;33m": [EMOJI_BOLD_YELLOW, "bold-yellow"],
  "\x1b[1;34m": [EMOJI_BOLD_BLUE, "bold-blue"],
  "\x1b[1;35m": [EMOJI_BOLD_MAGENTA, "bold-magenta"],
  "\x1b[1;36m": [EMOJI_BOLD_CYAN, "bold-cyan"],
  "\x1b[1;37m": [EMOJI_BOLD_WHITE, "bold-white"],

  // dedicated control characters
  "\x1b[1m": [EMOJI_BOLD, "bold"],
  "\x1b[90m": [EMOJI_HIGH_INTENSITY, "high-intensity", "hi", "bright", "💎"],
  "\x1b[4m": [EMOJI_UNDERLINE, "underline", "⚓️", "⎁"],
};

/**
 * Flatten ANSI_ALIAS_MAP into a lookup table from any alias string
 * (emoji or textual) to the corresponding ANSI code.
 */
export const MAP_EMOJI_TO_ANSI: Record<string, string> = {};

for (const [ansiCode, aliases] of Object.entries(ANSI_ALIAS_MAP)) {
  for (const alias of aliases) {
    MAP_EMOJI_TO_ANSI[alias] = ansiCode;
  }
}

const ANSI_RESET = "\x1b[0m";

function tokenize(input: string) {
  const re = /<\/?[^>]+>/g;
  let lastIndex = 0,
    match: RegExpExecArray | null;
  const tokens: { text?: string; tag?: string }[] = [];

  while ((match = re.exec(input))) {
    if (match.index > lastIndex) {
      tokens.push({ text: input.slice(lastIndex, match.index) });
    }
    tokens.push({ tag: match[0] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < input.length) {
    tokens.push({ text: input.slice(lastIndex) });
  }
  return tokens;
}

function parse(tokens: { text?: string; tag?: string }[]): Node[] {
  const root: Node[] = [];
  const stack: { name: string; children: Node[] }[] = [];

  let current = root;
  for (const tk of tokens) {
    if (tk.tag) {
      const isClosing = tk.tag.startsWith("</"),
        name = tk.tag.replace(/<\/?|>/g, "");
      if (!isClosing) {
        // open-tag
        const node = { name, children: [] };
        current.push({ type: "tag", ...node });
        stack.push({ name, children: current });
        current = node.children;
      } else {
        // close-tag
        const last = stack.pop();
        if (last?.name === name) {
          current = last.children;
        } else {
          // mismatched tag: treat as text
          current.push({ type: "text", content: tk.tag });
        }
      }
    } else if (tk.text) {
      current.push({ type: "text", content: tk.text });
    }
  }
  return root;
}

/**
 * Renders an array of nodes into a single string, handling nested ANSI styles.
 * @param nodes Array of parsed nodes to render.
 * @param activeCodes Stack of ANSI codes inherited from parent tags.
 * @returns A string with ANSI escape codes applied, properly reapplying parent styles after nested resets.
 */
function render(nodes: Node[], activeCodes: string[] = []): string {
  let out = "";

  for (const n of nodes) {
    if (n.type === "text") {
      out += n.content;
    } else {
      const code = MAP_EMOJI_TO_ANSI[n.name];
      if (code) {
        // Build the new active-codes stack for this tag
        const newActive = [...activeCodes, code];

        // Render children with the new activeCodes
        const inner = render(n.children, newActive);

        // After closing this tag, we reset all, then reapply the parent's codes
        const reapplyParent = activeCodes.join("");

        out += code + inner + ANSI_RESET + reapplyParent;
      } else {
        // unknown tag: render literally
        out += `<${n.name}>` + render(n.children, activeCodes) + `</${n.name}>`;
      }
    }
  }

  return out;
}

/**
 * Converts emoji-wrapped text into ANSI-colored terminal output.
 *
 * This function processes a string containing emoji tags and replaces them with
 * the corresponding ANSI escape codes for terminal text styling. It supports
 * nested styles, where inner tags can override or combine with outer styles.
 *
 * @example
 * // Basic usage with a single color
 * colorize("Hello <🔴>world</🔴>!");
 * // Returns: "Hello \x1b[31mworld\x1b[0m!" (red text in terminal)
 *
 * @example
 * // Nested styles
 * colorize("<🧱>Bold and <🔴>red</🔴></🧱> text");
 * // Returns: "\x1b[1mBold and \x1b[31mred\x1b[0m\x1b[1m\x1b[0m text"
 *
 * @param {string} input - The input string containing emoji tags to be converted.
 *                         Tags should be in the format `<emoji>text</emoji>`.
 *                         Unknown tags are rendered literally.
 * @returns {string} The input string with emoji tags replaced by ANSI escape codes.
 *                  The output is ready to be printed to a terminal that supports
 *                  ANSI color codes.
 */
export function colorize(input: string): string {
  const tokens = tokenize(input);
  const ast = parse(tokens);
  return render(ast, []);
}
