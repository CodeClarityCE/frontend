// Flags whitespace-only text at the start or end of an element next to an interpolation or element.
// Vue's default whitespace condensing drops that text, so words run together ("CWE-1333Inefficient").

const KEEPS_WHITESPACE = new Set(["pre", "textarea"]);

// Newlines are layout from formatting; a space with no newline is meant as a separator.
const isSeparatorSpace = (node) =>
  node?.type === "VText" &&
  node.value.trim() === "" &&
  !node.value.includes("\n");

const isContent = (node) =>
  node?.type === "VExpressionContainer" || node?.type === "VElement";

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow leading or trailing whitespace-only text that Vue's whitespace condensing removes",
    },
    schema: [],
    messages: {
      leading:
        "Vue removes this leading space, so the text runs into what comes before. Put the space outside the element or inside the interpolation.",
      trailing:
        "Vue removes this trailing space, so the text runs into what comes after. Put the space outside the element or inside the interpolation.",
    },
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services?.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      VElement(element) {
        if (KEEPS_WHITESPACE.has(element.rawName.toLowerCase())) return;
        const children = element.children;
        if (children.length < 2) return;

        const first = children[0];
        if (isSeparatorSpace(first) && isContent(children[1])) {
          context.report({ node: first, messageId: "leading" });
        }
        const last = children[children.length - 1];
        if (
          isSeparatorSpace(last) &&
          isContent(children[children.length - 2])
        ) {
          context.report({ node: last, messageId: "trailing" });
        }
      },
    });
  },
};

export default rule;
