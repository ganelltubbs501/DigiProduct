import { Marked, type Tokens } from "marked";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// AI and user content is rendered with raw HTML disabled and only http(s)/mailto links allowed.
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text);
    },
    link(token: Tokens.Link) {
      const href = /^(https?:|mailto:)/i.test(token.href) ? token.href : "#";
      return `<a href="${escapeHtml(href)}" rel="noopener noreferrer nofollow" target="_blank">${this.parser.parseInline(token.tokens)}</a>`;
    },
    image(token: Tokens.Image) {
      return escapeHtml(token.text);
    },
  },
});

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
