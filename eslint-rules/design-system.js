// Design system guardrail: bans raw colours, stray icon sets and removed components.
import path from "node:path";

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITIES =
  "bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide|fill|stroke|from|via|to|placeholder|decoration|accent|caret|shadow|inset-shadow|inset-ring|drop-shadow|text-shadow";

const HEX_RE =
  /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const PALETTE_RE = new RegExp(
  `(?<![\\w-])(?:${UTILITIES})-(?:(?:${PALETTE})-(?:50|[1-9]00|950)|black|white)(?![\\w-])`,
  "g",
);
// Legacy theme-<colour> classes and --color-theme-* variables, with any prefix or shade.
// Non-colour options such as a library's theme-default stay allowed.
const THEME_COLOURS = `primary|secondary|accent|black|white|grey|${PALETTE}`;
// Segments split on "-", so the repeated group cannot backtrack badly.
const THEME_RE = new RegExp(
  `(?<![\\w-])(?:-?-?[a-z]+-)*theme-(?:${THEME_COLOURS})(?:-[a-z0-9]+)*(?![\\w-])`,
  "g",
);

// Iconify sets seen in this codebase plus common ones; anything else is checked only on icon props.
const KNOWN_ICON_SETS = new Set(
  "solar tabler mdi bi material-symbols ic line-md eos-icons ion iconoir radix-icons oi octicon mingcute fa-brands fa fa6-solid fa6-brands ant-design ri pajamas fluent-mdl2 akar-icons ph skill-icons logos lucide heroicons carbon simple-line-icons".split(
    " ",
  ),
);
// eslint-disable-next-line security/detect-unsafe-regex
const ICON_ID_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*):[a-z0-9]+(?:-[a-z0-9]+)*$/;
// eslint-disable-next-line security/detect-unsafe-regex
const ICON_PREFIX_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*):/;
const ICON_PKG_RE = /^@iconify-(?:json|icons)\/([^/]+)/;

const CATEGORIES = ["hex", "palette", "theme", "icon", "removed"];

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Use design tokens, Lucide icons and current components instead of raw colours, stray icon sets and removed components",
    },
    schema: [
      {
        type: "object",
        properties: {
          root: { type: "string" },
          allowlist: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { enum: CATEGORIES },
            },
          },
          logoIconSets: { type: "array", items: { type: "string" } },
          removedComponents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                path: { type: "string" },
              },
              required: ["path"],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hex: "Hex colour {{value}}: use a colour token instead.",
      palette:
        "Raw palette class {{value}}: use a semantic token class instead.",
      theme: "Legacy theme colour {{value}}: use a semantic token instead.",
      icon: "Icon {{value}} is not from a logo set: use @lucide/vue for general icons.",
      iconDynamic:
        "Icon id {{value}} is built at runtime: write each full logo id as a string literal so it gets bundled.",
      removed: "{{value}} was removed: use its replacement instead.",
      stale:
        'This file no longer breaks "{{category}}": remove it from the design system allowlist.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const root = options.root ?? context.cwd;
    const logoSets = new Set(
      options.logoIconSets ?? ["simple-icons", "devicon"],
    );
    const removed = (options.removedComponents ?? []).map((c) => ({
      name: c.name,
      path: stripExt(toPosix(c.path)),
    }));
    const file = toPosix(path.relative(root, context.filename));
    const allowed = new Set(
      new Map(Object.entries(options.allowlist ?? {})).get(file) ?? [],
    );
    const seen = new Set();
    const sourceCode = context.sourceCode;

    function report(category, node, value, loc, messageId = category) {
      seen.add(category);
      if (allowed.has(category)) return;
      context.report({
        ...(loc ? { loc } : { node }),
        messageId,
        data: { value },
      });
    }

    // Scans text for colour patterns; offset maps matches to source positions.
    function scanColours(text, node, offset) {
      for (const [category, re] of [
        ["hex", HEX_RE],
        ["palette", PALETTE_RE],
        ["theme", THEME_RE],
      ]) {
        for (const m of text.matchAll(re)) {
          const loc =
            offset === undefined
              ? undefined
              : {
                  start: sourceCode.getLocFromIndex(offset + m.index),
                  end: sourceCode.getLocFromIndex(
                    offset + m.index + m[0].length,
                  ),
                };
          report(category, node, m[0], loc);
        }
      }
    }

    function checkIcon(value, node, isIconProp) {
      const m = ICON_ID_RE.exec(value);
      if (!m) return;
      const set = m[1];
      if (logoSets.has(set)) return;
      if (isIconProp || KNOWN_ICON_SETS.has(set)) report("icon", node, value);
    }

    // Flags `set:${name}` ids, which the logo bundler cannot see.
    function checkIconTemplate(node) {
      if (!isIconTemplate(node)) return;
      report("icon", node, sourceCode.getText(node), undefined, "iconDynamic");
    }

    function isIconTemplate(node) {
      if (node.expressions.length === 0) return false;
      const m = ICON_PREFIX_RE.exec(node.quasis[0].value.cooked ?? "");
      return Boolean(m && (logoSets.has(m[1]) || KNOWN_ICON_SETS.has(m[1])));
    }

    // Flags "set:" + name, which the logo bundler cannot see either.
    function checkIconConcat(node) {
      const left = node.left;
      if (node.operator !== "+" || left.type !== "Literal") return;
      const m = ICON_PREFIX_RE.exec(String(left.value));
      if (m && (logoSets.has(m[1]) || KNOWN_ICON_SETS.has(m[1]))) {
        report(
          "icon",
          node,
          sourceCode.getText(node),
          undefined,
          "iconDynamic",
        );
      }
    }

    function isIconProperty(node) {
      const parent = node.parent;
      if (parent?.type !== "Property" || parent.value !== node) return false;
      const key = parent.key;
      return (key.type === "Identifier" ? key.name : key.value) === "icon";
    }

    function checkString(value, node) {
      scanColours(value, node);
      checkIcon(value, node, isIconProperty(node));
    }

    function resolveImport(source) {
      let p;
      if (source.startsWith("@/")) p = `src/${source.slice(2)}`;
      else if (source.startsWith(".")) {
        p = toPosix(
          path.relative(
            root,
            path.resolve(path.dirname(context.filename), source),
          ),
        );
      } else return undefined;
      return stripExt(p);
    }

    function checkImport(node, source, specifiers) {
      if (typeof source !== "string") return;
      const pkg = ICON_PKG_RE.exec(source);
      if (pkg && !logoSets.has(pkg[1])) report("icon", node, source);

      const target = resolveImport(source);
      if (target === undefined) return;
      for (const c of removed) {
        if (target === c.path || target === `${c.path}/index`) {
          report("removed", node, c.name ?? c.path);
        } else if (c.name && c.path.startsWith(`${stripIndex(target)}/`)) {
          // Named import from a barrel above the removed component.
          for (const s of specifiers) {
            const imported = s.imported ?? s.exported ?? s.local;
            const name =
              imported?.type === "Identifier" ? imported.name : imported?.value;
            if (name === c.name) report("removed", s, c.name);
          }
        }
      }
    }

    function finish() {
      for (const category of allowed) {
        if (!seen.has(category)) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "stale",
            data: { category },
          });
        }
      }
    }

    const scriptVisitor = {
      Literal(node) {
        if (typeof node.value === "string") checkString(node.value, node);
      },
      TemplateElement(node) {
        scanColours(node.value.cooked ?? node.value.raw, node);
      },
      TemplateLiteral: checkIconTemplate,
      BinaryExpression: checkIconConcat,
      ImportDeclaration(node) {
        checkImport(node, node.source.value, node.specifiers);
      },
      ExportNamedDeclaration(node) {
        if (node.source) checkImport(node, node.source.value, node.specifiers);
      },
      ExportAllDeclaration(node) {
        checkImport(node, node.source.value, []);
      },
      ImportExpression(node) {
        if (node.source.type === "Literal")
          checkImport(node, node.source.value, []);
      },
    };

    const services = sourceCode.parserServices;
    const isVue =
      typeof services?.defineDocumentVisitor === "function" &&
      services.getDocumentFragment?.() != null;
    if (!isVue) return { ...scriptVisitor, "Program:exit": finish };

    // Templates and style blocks are walked after the script; finish runs last.
    const documentVisitor = services.defineDocumentVisitor({
      "VAttribute[directive=false]"(node) {
        if (!node.value) return;
        scanColours(node.value.value, node.value);
        if (node.key.name === "icon")
          checkIcon(node.value.value, node.value, true);
      },
      "VAttribute[directive=true] Literal"(node) {
        if (typeof node.value !== "string") return;
        scanColours(node.value, node);
        checkIcon(node.value, node, isIconBinding(node));
      },
      "VAttribute[directive=true] TemplateElement"(node) {
        scanColours(node.value.cooked ?? node.value.raw, node);
      },
      "VAttribute[directive=true] TemplateLiteral": checkIconTemplate,
      "VAttribute[directive=true] BinaryExpression": checkIconConcat,
      "VElement[name='style'] > VText"(node) {
        scanColours(node.value, node, node.range[0]);
      },
      "VDocumentFragment:exit": finish,
    });
    return { ...scriptVisitor, ...documentVisitor };
  },
};

// True when a template literal sits inside an :icon binding or an icon object field.
function isIconBinding(node) {
  let n = node.parent;
  while (n && n.type !== "VAttribute") {
    if (n.type === "Property") {
      const key = n.key;
      return (key.type === "Identifier" ? key.name : key.value) === "icon";
    }
    n = n.parent;
  }
  return n?.key?.argument?.name === "icon";
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function stripExt(p) {
  return p.replace(/\.(vue|ts|js|mjs|tsx|jsx)$/, "");
}

function stripIndex(p) {
  return p.replace(/\/index$/, "");
}

export default rule;
