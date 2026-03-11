/**
 * Document conversion engine — pure TypeScript functions for Markdown, HTML,
 * CSV, JSON, and YAML transformations.
 *
 * Zero runtime dependencies. All conversions use string processing only.
 */

import type { ConversionResult, TableData } from "./types.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return UTF-8 byte length of a string. */
function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** Build a ConversionResult from source/target strings and format names. */
function makeResult(
  content: string,
  sourceFormat: string,
  targetFormat: string,
  source: string,
): ConversionResult {
  return {
    content,
    sourceFormat,
    targetFormat,
    sourceSize: byteLength(source),
    targetSize: byteLength(content),
  };
}

/** Escape special HTML characters in a string. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Decode common HTML entities back to characters. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

/**
 * Parse a CSV string into a 2D array of strings.
 *
 * Handles quoted fields (with commas and newlines inside quotes),
 * escaped quotes (""), and custom delimiters.
 */
function parseCsv(source: string, delimiter: string = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < source.length && source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(field);
        field = "";
      } else if (ch === "\n" || (ch === "\r" && source[i + 1] === "\n")) {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        if (ch === "\r") i++;
      } else if (ch === "\r") {
        // bare \r (old Mac line ending)
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // Last field/row
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Markdown → HTML
// ---------------------------------------------------------------------------

/** Apply inline Markdown formatting to a line of text. */
function processInline(text: string): string {
  // Images: ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic: *text* or _text_ (but not inside words for _)
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

/**
 * Convert Markdown to HTML.
 *
 * Supports headings (#-######), bold, italic, inline code, fenced code blocks,
 * links, images, unordered lists (- or *), ordered lists (1.), blockquotes (>),
 * horizontal rules (---/***), and paragraphs.
 */
export function markdownToHtml(source: string): ConversionResult {
  const lines = source.split("\n");
  const htmlParts: string[] = [];

  let inCodeBlock = false;
  let codeBlockContent = "";
  let codeBlockLang = "";
  let inList: "ul" | "ol" | null = null;
  let paragraphBuffer: string[] = [];

  function flushParagraph(): void {
    if (paragraphBuffer.length > 0) {
      const content = paragraphBuffer.map(processInline).join("\n");
      htmlParts.push(`<p>${content}</p>`);
      paragraphBuffer = [];
    }
  }

  function closeList(): void {
    if (inList) {
      htmlParts.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        flushParagraph();
        closeList();
        inCodeBlock = true;
        codeBlockLang = line.trimStart().slice(3).trim();
        codeBlockContent = "";
      } else {
        const langAttr = codeBlockLang
          ? ` class="language-${escapeHtml(codeBlockLang)}"`
          : "";
        htmlParts.push(
          `<pre><code${langAttr}>${escapeHtml(codeBlockContent.replace(/\n$/, ""))}</code></pre>`,
        );
        inCodeBlock = false;
        codeBlockContent = "";
        codeBlockLang = "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? "\n" : "") + line;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      flushParagraph();
      closeList();
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      flushParagraph();
      closeList();
      htmlParts.push("<hr>");
      continue;
    }

    // Headings: # to ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      htmlParts.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // Blockquote: >
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      flushParagraph();
      closeList();
      const content = processInline(bqMatch[1]);
      htmlParts.push(`<blockquote><p>${content}</p></blockquote>`);
      continue;
    }

    // Unordered list: - or *
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (inList !== "ul") {
        closeList();
        htmlParts.push("<ul>");
        inList = "ul";
      }
      htmlParts.push(`<li>${processInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list: 1.
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (inList !== "ol") {
        closeList();
        htmlParts.push("<ol>");
        inList = "ol";
      }
      htmlParts.push(`<li>${processInline(olMatch[1])}</li>`);
      continue;
    }

    // Regular text — accumulate for paragraph
    paragraphBuffer.push(line);
  }

  // Flush remaining state
  if (inCodeBlock) {
    const langAttr = codeBlockLang
      ? ` class="language-${escapeHtml(codeBlockLang)}"`
      : "";
    htmlParts.push(
      `<pre><code${langAttr}>${escapeHtml(codeBlockContent)}</code></pre>`,
    );
  }
  flushParagraph();
  closeList();

  const content = htmlParts.join("\n");
  return makeResult(content, "markdown", "html", source);
}

// ---------------------------------------------------------------------------
// HTML → Plain Text
// ---------------------------------------------------------------------------

/**
 * Strip all HTML tags and decode entities to produce plain text.
 *
 * Removes script/style contents. Normalizes whitespace.
 */
export function htmlToText(source: string): ConversionResult {
  let text = source;

  // Remove script and style blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Replace block-level tags with newlines
  text = text.replace(
    /<\/?(?:p|div|br|h[1-6]|li|tr|blockquote|pre|hr)(?:\s[^>]*)?\/?>/gi,
    "\n",
  );

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = decodeEntities(text);

  // Normalize whitespace: collapse runs within lines
  const lines = text.split("\n").map((line) => line.replace(/\s+/g, " ").trim());
  text = lines.join("\n");

  // Collapse multiple blank lines into at most two newlines
  while (text.includes("\n\n\n")) {
    text = text.replace(/\n\n\n/g, "\n\n");
  }

  const content = text.trim();
  return makeResult(content, "html", "text", source);
}

// ---------------------------------------------------------------------------
// CSV → JSON
// ---------------------------------------------------------------------------

/**
 * Convert CSV to a JSON array of objects.
 *
 * The first row is used as headers (object keys). Handles quoted fields,
 * escaped quotes, and custom delimiters.
 */
export function csvToJson(
  source: string,
  delimiter: string = ",",
): ConversionResult {
  const rows = parseCsv(source, delimiter);
  if (rows.length === 0) {
    return makeResult("[]", "csv", "json", source);
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const objects = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = i < row.length ? row[i] : "";
    });
    return obj;
  });

  const content = JSON.stringify(objects, null, 2);
  return makeResult(content, "csv", "json", source);
}

// ---------------------------------------------------------------------------
// JSON → CSV
// ---------------------------------------------------------------------------

/** Quote a CSV field if it contains special characters. */
function quoteCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Convert a JSON array of objects to CSV.
 *
 * Extracts all unique keys as headers. Nested values are JSON-stringified.
 */
export function jsonToCsv(source: string): ConversionResult {
  const data: unknown = JSON.parse(source);
  if (!Array.isArray(data) || data.length === 0) {
    return makeResult("", "json", "csv", source);
  }

  // Collect all unique keys in order of appearance
  const allKeys: string[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const key of Object.keys(item as Record<string, unknown>)) {
        if (!seen.has(key)) {
          allKeys.push(key);
          seen.add(key);
        }
      }
    }
  }

  const lines: string[] = [];
  // Header row
  lines.push(allKeys.map(quoteCsvField).join(","));

  // Data rows
  for (const item of data) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      const row = allKeys.map((key) => {
        const val = record[key];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return quoteCsvField(JSON.stringify(val));
        return quoteCsvField(String(val));
      });
      lines.push(row.join(","));
    }
  }

  const content = lines.join("\n");
  return makeResult(content, "json", "csv", source);
}

// ---------------------------------------------------------------------------
// CSV → TableData
// ---------------------------------------------------------------------------

/**
 * Parse CSV into structured TableData with headers, rows, and counts.
 */
export function csvToTable(
  source: string,
  delimiter: string = ",",
): TableData {
  const rows = parseCsv(source, delimiter);
  if (rows.length === 0) {
    return { headers: [], rows: [], rowCount: 0, columnCount: 0 };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  return {
    headers,
    rows: dataRows,
    rowCount: dataRows.length,
    columnCount: headers.length,
  };
}

// ---------------------------------------------------------------------------
// CSV → Markdown Table
// ---------------------------------------------------------------------------

/**
 * Convert CSV to a Markdown table with pipe separators and alignment row.
 */
export function csvToMarkdown(
  source: string,
  delimiter: string = ",",
): ConversionResult {
  const table = csvToTable(source, delimiter);
  if (table.headers.length === 0) {
    return makeResult("", "csv", "markdown", source);
  }

  // Calculate column widths
  const widths = table.headers.map((h) => h.length);
  for (const row of table.rows) {
    for (let i = 0; i < row.length && i < widths.length; i++) {
      widths[i] = Math.max(widths[i], row[i].length);
    }
  }
  // Minimum width of 3 for the separator dashes
  for (let i = 0; i < widths.length; i++) {
    widths[i] = Math.max(widths[i], 3);
  }

  // Header line
  const headerCells = table.headers.map((h, i) => h.padEnd(widths[i]));
  const headerLine = "| " + headerCells.join(" | ") + " |";

  // Separator line
  const sepCells = widths.map((w) => "-".repeat(w));
  const sepLine = "| " + sepCells.join(" | ") + " |";

  // Data rows
  const dataLines = table.rows.map((row) => {
    const cells = table.headers.map((_, i) => {
      const value = i < row.length ? row[i] : "";
      return value.padEnd(widths[i]);
    });
    return "| " + cells.join(" | ") + " |";
  });

  const content = [headerLine, sepLine, ...dataLines].join("\n");
  return makeResult(content, "csv", "markdown", source);
}

// ---------------------------------------------------------------------------
// CSV → HTML Table
// ---------------------------------------------------------------------------

/**
 * Convert CSV to an HTML table with proper thead/tbody structure.
 */
export function csvToHtml(
  source: string,
  delimiter: string = ",",
): ConversionResult {
  const table = csvToTable(source, delimiter);
  if (table.headers.length === 0) {
    const content = "<table></table>";
    return makeResult(content, "csv", "html", source);
  }

  const lines: string[] = ["<table>", "  <thead>", "    <tr>"];
  for (const h of table.headers) {
    lines.push(`      <th>${escapeHtml(h)}</th>`);
  }
  lines.push("    </tr>", "  </thead>", "  <tbody>");

  for (const row of table.rows) {
    lines.push("    <tr>");
    for (let i = 0; i < table.headers.length; i++) {
      const value = i < row.length ? row[i] : "";
      lines.push(`      <td>${escapeHtml(value)}</td>`);
    }
    lines.push("    </tr>");
  }

  lines.push("  </tbody>", "</table>");
  const content = lines.join("\n");
  return makeResult(content, "csv", "html", source);
}

// ---------------------------------------------------------------------------
// JSON → YAML
// ---------------------------------------------------------------------------

/** Format a scalar value for YAML output. */
function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  const s = String(value);
  // Quote strings containing special characters
  if (
    /[:#\[\]{},"&*!|>']/.test(s) ||
    /^(true|false|null|yes|no|on|off)$/i.test(s) ||
    s === ""
  ) {
    const escaped = s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return s;
}

/** Recursively convert a JS value to YAML-like lines. */
function toYamlLines(obj: unknown, indent: number = 0): string[] {
  const prefix = "  ".repeat(indent);
  const lines: string[] = [];

  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        lines.push(...toYamlLines(value, indent + 1));
      } else if (Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        for (const item of value) {
          if (item && typeof item === "object") {
            lines.push(`${prefix}  -`);
            lines.push(...toYamlLines(item, indent + 2));
          } else {
            lines.push(`${prefix}  - ${yamlScalar(item)}`);
          }
        }
      } else {
        lines.push(`${prefix}${key}: ${yamlScalar(value)}`);
      }
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === "object") {
        lines.push(`${prefix}-`);
        lines.push(...toYamlLines(item, indent + 1));
      } else {
        lines.push(`${prefix}- ${yamlScalar(item)}`);
      }
    }
  } else {
    lines.push(`${prefix}${yamlScalar(obj)}`);
  }

  return lines;
}

/**
 * Convert a JSON string to YAML-like format.
 *
 * Handles objects, arrays, strings, numbers, booleans, and null.
 * No external YAML library required.
 */
export function jsonToYaml(source: string): ConversionResult {
  const data: unknown = JSON.parse(source);
  const lines = toYamlLines(data);
  const content = lines.join("\n");
  return makeResult(content, "json", "yaml", source);
}

// ---------------------------------------------------------------------------
// Plain Text → HTML
// ---------------------------------------------------------------------------

/**
 * Convert plain text to HTML paragraphs.
 *
 * Splits on double newlines, wraps each paragraph in <p> tags.
 * Single newlines within a paragraph become <br> tags.
 * HTML entities in the source text are escaped.
 */
export function textToHtml(source: string): ConversionResult {
  if (!source.trim()) {
    return makeResult("", "text", "html", source);
  }

  const paragraphs = source
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p);

  const htmlParts = paragraphs.map((para) => {
    const escaped = escapeHtml(para);
    const withBreaks = escaped.replace(/\n/g, "<br>");
    return `<p>${withBreaks}</p>`;
  });

  const content = htmlParts.join("\n");
  return makeResult(content, "text", "html", source);
}

// ---------------------------------------------------------------------------
// HTML → Markdown
// ---------------------------------------------------------------------------

/**
 * Convert basic HTML to Markdown.
 *
 * Handles: h1-h6, p, a, strong/b, em/i, ul/ol/li, code, pre, br, img, blockquote.
 * Uses regex-based tag replacement.
 */
export function htmlToMarkdown(source: string): ConversionResult {
  let md = source;

  // Remove script and style blocks
  md = md.replace(/<script[\s\S]*?<\/script>/gi, "");
  md = md.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Pre/code blocks (must come before other processing)
  md = md.replace(
    /<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_match, content: string) => "\n\n```\n" + decodeEntities(content).trim() + "\n```\n\n",
  );
  md = md.replace(
    /<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_match, content: string) => "\n\n```\n" + decodeEntities(content).trim() + "\n```\n\n",
  );

  // Images: <img src="..." alt="...">
  md = md.replace(
    /<img[^>]*\ssrc=["']([^"']+)["'][^>]*\salt=["']([^"']*?)["'][^>]*\/?>/gi,
    (_match, src: string, alt: string) => `![${alt}](${src})`,
  );
  md = md.replace(
    /<img[^>]*\salt=["']([^"']*?)["'][^>]*\ssrc=["']([^"']+)["'][^>]*\/?>/gi,
    (_match, alt: string, src: string) => `![${alt}](${src})`,
  );
  // img without alt
  md = md.replace(
    /<img[^>]*\ssrc=["']([^"']+)["'][^>]*\/?>/gi,
    (_match, src: string) => `![](${src})`,
  );

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n");
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n");

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match, content: string) => {
    const clean = content.replace(/<\/?p[^>]*>/gi, "").trim();
    return "\n> " + clean + "\n";
  });

  // Bold/Strong
  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**");

  // Italic/Em
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*");

  // Inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Links
  md = md.replace(
    /<a[^>]*\shref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, text: string) => `[${text}](${href})`,
  );

  // Lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, content: string) => {
    return "- " + content.replace(/<\/?[^>]+>/g, "").trim() + "\n";
  });
  md = md.replace(/<\/?(?:ul|ol)[^>]*>/gi, "\n");

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, "  \n");

  // Horizontal rules
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  // Decode entities
  md = decodeEntities(md);

  // Clean up excessive blank lines
  while (md.includes("\n\n\n")) {
    md = md.replace(/\n\n\n/g, "\n\n");
  }

  const content = md.trim();
  return makeResult(content, "html", "markdown", source);
}
