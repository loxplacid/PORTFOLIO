export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "call";

export interface Token {
  text: string;
  kind: TokenKind;
}

const TS_KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "function",
  "return",
  "async",
  "await",
  "new",
  "class",
  "interface",
  "type",
  "extends",
  "implements",
  "readonly",
  "static",
  "public",
  "private",
  "if",
  "else",
  "for",
  "of",
  "in",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "as",
  "null",
  "undefined",
  "true",
  "false",
  "this",
  "super",
  "void",
  "never",
  "unknown",
  "any",
  "string",
  "number",
  "boolean",
  "yield",
  "delete",
]);

const GLSL_KEYWORDS = new Set([
  "attribute",
  "uniform",
  "varying",
  "void",
  "float",
  "int",
  "bool",
  "vec2",
  "vec3",
  "vec4",
  "mat2",
  "mat3",
  "mat4",
  "sampler2D",
  "precision",
  "highp",
  "mediump",
  "lowp",
  "if",
  "else",
  "for",
  "while",
  "return",
  "discard",
  "const",
  "in",
  "out",
  "inout",
  "length",
  "normalize",
  "mix",
  "step",
  "smoothstep",
  "fract",
  "sin",
  "cos",
  "tan",
  "pow",
  "abs",
  "max",
  "min",
  "dot",
  "cross",
  "clamp",
  "texture2D",
  "gl_Position",
  "gl_PointSize",
  "gl_PointCoord",
  "gl_FragColor",
]);

const KEYWORDS: Record<string, Set<string>> = {
  ts: TS_KEYWORDS,
  glsl: GLSL_KEYWORDS,
};

const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([{}()[\];:,.<>=+\-*/%!&|?~^]+)/g;

export function tokenize(code: string, language: string): Token[] {
  const keywords = KEYWORDS[language] ?? new Set<string>();
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, start), kind: "plain" });
    }
    const [full, comment, str, num, ident, punct] = match;
    if (comment) {
      tokens.push({ text: full, kind: "comment" });
    } else if (str) {
      tokens.push({ text: full, kind: "string" });
    } else if (num) {
      tokens.push({ text: full, kind: "number" });
    } else if (ident) {
      if (keywords.has(ident)) {
        tokens.push({ text: full, kind: "keyword" });
      } else {
        let cursor = start + full.length;
        while (cursor < code.length && /\s/.test(code[cursor])) cursor++;
        tokens.push({
          text: full,
          kind: code[cursor] === "(" ? "call" : "plain",
        });
      }
    } else if (punct) {
      tokens.push({ text: full, kind: "plain" });
    }
    lastIndex = start + full.length;
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), kind: "plain" });
  }
  return tokens;
}
