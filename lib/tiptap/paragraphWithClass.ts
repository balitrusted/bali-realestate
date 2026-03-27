import Paragraph from "@tiptap/extension-paragraph";

/**
 * Paragraph that keeps `class` in HTML (e.g. `article-image-caption` for photo credits).
 */
export const ParagraphWithClass = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
    };
  },
});
