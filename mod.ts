type Node =
  | { type: "text"; content: string }
  | { type: "tag"; name: string; children: Node[] };

// standard colors
export const EMOJI_BLACK = "⚫";
export const EMOJI_RED = "🔴";
export const EMOJI_GREEN = "🟢";
export const EMOJI_YELLOW = "🟡";
export const EMOJI_BLUE = "🔵";
export const EMOJI_MAGENTA = "🟣";
export const CYAN_EMOJI = "🥶";
export const WHITE_EMOJI = "⚪";

// bold colors
export const EMOJI_BOLD_BLACK = "⬛️";
export const EMOJI_BOLD_RED = "🟥";
export const EMOJI_BOLD_GREEN = "🟩";
export const EMOJI_BOLD_YELLOW = "🟨";
export const EMOJI_BOLD_BLUE = "🟦";
export const EMOJI_BOLD_MAGENTA = "🟪";
export const EMOJI_BOLD_CYAN = "🧊";
export const EMOJI_BOLD_WHITE = "⬜";

// dedicated control characters
export const EMOJI_BOLD = "🧱";
export const EMOJI_HIGH_INTENSITY = "💎";
export const EMOJI_UNDERLINE = "🔳";

export const MAP_EMOJI_TO_ANSI: Record<string, string> = {
  // standard
  [EMOJI_BLACK]: "\x1b[30m",
  [EMOJI_RED]: "\x1b[31m",
  [EMOJI_GREEN]: "\x1b[32m",
  [EMOJI_YELLOW]: "\x1b[33m",
  [EMOJI_BLUE]: "\x1b[34m",
  [EMOJI_MAGENTA]: "\x1b[35m",
  [CYAN_EMOJI]: "\x1b[36m",
  [WHITE_EMOJI]: "\x1b[37m",

  // bold
  [EMOJI_BOLD_BLACK]: "\x1b[1;90m",
  [EMOJI_BOLD_RED]: "\x1b[1;31m",
  [EMOJI_BOLD_GREEN]: "\x1b[1;32m",
  [EMOJI_BOLD_YELLOW]: "\x1b[1;33m",
  [EMOJI_BOLD_BLUE]: "\x1b[1;34m",
  [EMOJI_BOLD_MAGENTA]: "\x1b[1;35m",
  [EMOJI_BOLD_CYAN]: "\x1b[1;36m",
  [EMOJI_BOLD_WHITE]: "\x1b[1;37m",

  // dedicated control characters
  [EMOJI_BOLD]: "\x1b[1m",
  [EMOJI_HIGH_INTENSITY]: "\x1b[90m",
  [EMOJI_UNDERLINE]: "\x1b[4m",
};

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

export function colorize(input: string): string {
  const tokens = tokenize(input);
  const ast = parse(tokens);
  return render(ast, []);
}
