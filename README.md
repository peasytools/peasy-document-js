# peasy-document

[![npm version](https://agentgif.com/badge/npm/peasy-document/version.svg)](https://www.npmjs.com/package/peasy-document)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/peasy-document)

Pure TypeScript document conversion library for Markdown, HTML, CSV, JSON, and YAML transformations. Convert between 6 document formats with 10 conversion functions and frozen result objects -- all with zero runtime dependencies. Every conversion uses pure string processing, making it lightweight and fast for any JavaScript or TypeScript project.

Part of the [Peasy Tools](https://peasytools.com) developer tools ecosystem.

<p align="center">
  <img src="demo.gif" alt="peasy-document demo — Markdown to HTML conversion in terminal" width="800">
</p>

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [What You Can Do](#what-you-can-do)
  - [Markdown Conversion](#markdown-conversion)
  - [HTML Processing](#html-processing)
  - [CSV and JSON Conversion](#csv-and-json-conversion)
  - [YAML Generation](#yaml-generation)
  - [Table Formatting](#table-formatting)
- [TypeScript Types](#typescript-types)
- [API Reference](#api-reference)
- [Also Available for Python](#also-available-for-python)
- [Peasy Developer Tools](#peasy-developer-tools)
- [License](#license)

## Install

```bash
npm install peasy-document
```

Zero runtime dependencies. Works in Node.js, Deno, Bun, and modern bundlers.

## Quick Start

```typescript
import { markdownToHtml, csvToJson, htmlToText } from "peasy-document";

// Convert Markdown to HTML with headings, bold, italic, code blocks, and lists
const result = markdownToHtml("# Hello World\n\nThis is **bold** text.");
console.log(result.content);
// <h1>Hello World</h1>
// <p>This is <strong>bold</strong> text.</p>

// Convert CSV data to JSON array of objects
const json = csvToJson("name,age\nAlice,30\nBob,25");
console.log(json.content);
// [{"name": "Alice", "age": "30"}, {"name": "Bob", "age": "25"}]

// Strip HTML to plain text with entity decoding
const text = htmlToText("<h1>Title</h1><p>Hello &amp; welcome.</p>");
console.log(text.content);
// Title
// Hello & welcome.
```

All functions return a `ConversionResult` with metadata:

```typescript
const result = markdownToHtml("# Hello");
console.log(result.sourceFormat);  // "markdown"
console.log(result.targetFormat);  // "html"
console.log(result.sourceSize);    // 7 (bytes)
console.log(result.targetSize);    // 14 (bytes)
```

## What You Can Do

### Markdown Conversion

Convert Markdown to HTML using a built-in pure TypeScript parser. Supports headings (h1-h6), bold, italic, inline code, fenced code blocks with language hints, links, images, unordered and ordered lists, blockquotes, horizontal rules, and paragraphs.

```typescript
import { markdownToHtml } from "peasy-document";

// Full Markdown document with multiple elements
const result = markdownToHtml(`
# API Documentation

| Feature | Status |
|---------|--------|
| Auth    | Done   |

\`\`\`typescript
const api = new Client({ key: "abc" });
\`\`\`

- First item
- Second item

> Important note about the API
`);

console.log(result.content);
// <h1>API Documentation</h1>
// <pre><code class="language-typescript">...</code></pre>
// <ul><li>First item</li>...</ul>
// <blockquote><p>Important note about the API</p></blockquote>
```

### HTML Processing

Extract plain text from HTML documents, convert HTML to Markdown, or turn plain text into HTML paragraphs.

```typescript
import { htmlToText, htmlToMarkdown, textToHtml } from "peasy-document";

// Strip all HTML tags and decode entities
const text = htmlToText(`
<html><body>
  <h1>Welcome</h1>
  <p>This is a <strong>formatted</strong> document with &amp; entities.</p>
  <script>alert('ignored')</script>
</body></html>
`);
console.log(text.content);
// Welcome
// This is a formatted document with & entities.

// Convert HTML back to Markdown (handles h1-h6, a, strong, em, lists, code, pre, img)
const md = htmlToMarkdown(`
<h1>Document</h1>
<p>Visit <a href="https://example.com">our site</a> for <strong>more info</strong>.</p>
<ul><li>First</li><li>Second</li></ul>
`);
console.log(md.content);
// # Document
// Visit [our site](https://example.com) for **more info**.
// - First
// - Second

// Convert plain text to HTML paragraphs
const html = textToHtml("First paragraph.\n\nSecond paragraph.\nWith a line break.");
console.log(html.content);
// <p>First paragraph.</p>
// <p>Second paragraph.<br>With a line break.</p>
```

### CSV and JSON Conversion

Transform between CSV and JSON formats with proper handling of quoted fields, commas inside values, escaped quotes, and custom delimiters. Roundtrip-safe.

```typescript
import { csvToJson, jsonToCsv } from "peasy-document";

// CSV to JSON array of objects
const json = csvToJson("name,role,team\nAlice,Engineer,Backend\nBob,Designer,Frontend");
console.log(json.content);
// [
//   {"name": "Alice", "role": "Engineer", "team": "Backend"},
//   {"name": "Bob", "role": "Designer", "team": "Frontend"}
// ]

// JSON back to CSV
const csv = jsonToCsv(json.content);
console.log(csv.content);
// name,role,team
// Alice,Engineer,Backend
// Bob,Designer,Frontend

// Tab-separated values
const tsv = csvToJson("name\tage\nAlice\t30", "\t");
```

### YAML Generation

Convert JSON to YAML-like format without any external YAML library. Handles nested objects, arrays, strings, numbers, booleans, and null.

```typescript
import { jsonToYaml } from "peasy-document";

const result = jsonToYaml(JSON.stringify({
  server: { host: "localhost", port: 8080 },
  features: ["auth", "logging"],
  debug: true,
  cache: null,
}));
console.log(result.content);
// server:
//   host: localhost
//   port: 8080
// features:
//   - auth
//   - logging
// debug: true
// cache: null
```

### Table Formatting

Parse CSV into structured table data, or render it directly as Markdown or HTML tables.

```typescript
import { csvToTable, csvToMarkdown, csvToHtml } from "peasy-document";

// Parse into structured TableData
const table = csvToTable("Name,Age,City\nAlice,30,NYC\nBob,25,LA");
console.log(table.headers);       // ["Name", "Age", "City"]
console.log(table.rowCount);      // 2
console.log(table.columnCount);   // 3
console.log(table.rows[0]);       // ["Alice", "30", "NYC"]

// Render as Markdown table with aligned columns
const md = csvToMarkdown("Name,Age,City\nAlice,30,NYC\nBob,25,LA");
console.log(md.content);
// | Name  | Age | City |
// | ----- | --- | ---- |
// | Alice | 30  | NYC  |
// | Bob   | 25  | LA   |

// Render as HTML table with thead/tbody structure
const html = csvToHtml("Name,Age\nAlice,30");
console.log(html.content);
// <table>
//   <thead>
//     <tr><th>Name</th><th>Age</th></tr>
//   </thead>
//   <tbody>
//     <tr><td>Alice</td><td>30</td></tr>
//   </tbody>
// </table>
```

## TypeScript Types

```typescript
interface ConversionResult {
  content: string;      // The converted content
  sourceFormat: string;  // e.g. "markdown", "html", "csv", "json", "text"
  targetFormat: string;  // e.g. "html", "text", "json", "csv", "yaml", "markdown"
  sourceSize: number;    // Byte size of source (UTF-8)
  targetSize: number;    // Byte size of output (UTF-8)
}

interface TableData {
  headers: string[];     // Column headers from first row
  rows: string[][];      // Data rows
  rowCount: number;      // Number of data rows
  columnCount: number;   // Number of columns
}
```

## API Reference

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `markdownToHtml(source)` | Markdown | HTML | Headings, bold, italic, code, lists, links, images, blockquotes |
| `htmlToText(source)` | HTML | Plain text | Strip tags, decode entities, normalize whitespace |
| `htmlToMarkdown(source)` | HTML | Markdown | h1-h6, a, strong, em, lists, code, pre, img, blockquote |
| `textToHtml(source)` | Plain text | HTML | Paragraphs to `<p>` tags, newlines to `<br>` |
| `csvToJson(source, delimiter?)` | CSV | JSON | First row as headers, quoted field support |
| `jsonToCsv(source)` | JSON | CSV | All unique keys as headers, nested values stringified |
| `csvToTable(source, delimiter?)` | CSV | `TableData` | Structured headers, rows, and counts |
| `csvToMarkdown(source, delimiter?)` | CSV | Markdown | Pipe-separated table with alignment row |
| `csvToHtml(source, delimiter?)` | CSV | HTML | `<table>` with `<thead>` and `<tbody>` |
| `jsonToYaml(source)` | JSON | YAML | Objects, arrays, primitives, null handling |

## Also Available for Python

```bash
pip install peasy-document
```

The Python version provides the same 10 conversion functions with frozen dataclass results. See [peasy-document on PyPI](https://pypi.org/project/peasy-document/).

## Peasy Developer Tools

| Package | PyPI | npm | Description |
|---------|------|-----|-------------|
| **peasy-document** | [PyPI](https://pypi.org/project/peasy-document/) | [npm](https://www.npmjs.com/package/peasy-document) | Document conversion -- Markdown, HTML, CSV, JSON, YAML |
| peasy-pdf | [PyPI](https://pypi.org/project/peasy-pdf/) | -- | PDF manipulation and conversion |
| peasy-image | [PyPI](https://pypi.org/project/peasy-image/) | -- | Image format conversion and optimization |
| peasytext | [PyPI](https://pypi.org/project/peasytext/) | [npm](https://www.npmjs.com/package/peasytext) | Text analysis and transformation |
| peasy-css | [PyPI](https://pypi.org/project/peasy-css/) | [npm](https://www.npmjs.com/package/peasy-css) | CSS minification and processing |
| peasy-compress | [PyPI](https://pypi.org/project/peasy-compress/) | [npm](https://www.npmjs.com/package/peasy-compress) | File compression utilities |
| peasy-convert | [PyPI](https://pypi.org/project/peasy-convert/) | -- | Unified CLI for all Peasy tools |

## License

MIT
