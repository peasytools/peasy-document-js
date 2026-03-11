import { describe, expect, it } from "vitest";
import {
  markdownToHtml,
  htmlToText,
  csvToJson,
  jsonToCsv,
  csvToTable,
  csvToMarkdown,
  csvToHtml,
  jsonToYaml,
  textToHtml,
  htmlToMarkdown,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// markdownToHtml
// ---------------------------------------------------------------------------

describe("markdownToHtml", () => {
  it("converts h1 heading", () => {
    const result = markdownToHtml("# Hello World");
    expect(result.content).toBe("<h1>Hello World</h1>");
    expect(result.sourceFormat).toBe("markdown");
    expect(result.targetFormat).toBe("html");
  });

  it("converts h2 through h6 headings", () => {
    expect(markdownToHtml("## H2").content).toBe("<h2>H2</h2>");
    expect(markdownToHtml("### H3").content).toBe("<h3>H3</h3>");
    expect(markdownToHtml("#### H4").content).toBe("<h4>H4</h4>");
    expect(markdownToHtml("##### H5").content).toBe("<h5>H5</h5>");
    expect(markdownToHtml("###### H6").content).toBe("<h6>H6</h6>");
  });

  it("converts paragraphs", () => {
    const result = markdownToHtml("Hello world\n\nSecond paragraph");
    expect(result.content).toContain("<p>Hello world</p>");
    expect(result.content).toContain("<p>Second paragraph</p>");
  });

  it("converts bold text", () => {
    const result = markdownToHtml("This is **bold** text");
    expect(result.content).toContain("<strong>bold</strong>");
  });

  it("converts italic text", () => {
    const result = markdownToHtml("This is *italic* text");
    expect(result.content).toContain("<em>italic</em>");
  });

  it("converts inline code", () => {
    const result = markdownToHtml("Use `console.log` here");
    expect(result.content).toContain("<code>console.log</code>");
  });

  it("converts fenced code blocks", () => {
    const result = markdownToHtml("```javascript\nconst x = 1;\n```");
    expect(result.content).toContain('<pre><code class="language-javascript">');
    expect(result.content).toContain("const x = 1;");
    expect(result.content).toContain("</code></pre>");
  });

  it("converts fenced code blocks without language", () => {
    const result = markdownToHtml("```\ncode here\n```");
    expect(result.content).toContain("<pre><code>");
    expect(result.content).toContain("code here");
  });

  it("converts links", () => {
    const result = markdownToHtml("[Click](https://example.com)");
    expect(result.content).toContain('<a href="https://example.com">Click</a>');
  });

  it("converts images", () => {
    const result = markdownToHtml("![Alt text](image.png)");
    expect(result.content).toContain('<img src="image.png" alt="Alt text">');
  });

  it("converts unordered lists", () => {
    const result = markdownToHtml("- Item 1\n- Item 2\n- Item 3");
    expect(result.content).toContain("<ul>");
    expect(result.content).toContain("<li>Item 1</li>");
    expect(result.content).toContain("<li>Item 2</li>");
    expect(result.content).toContain("<li>Item 3</li>");
    expect(result.content).toContain("</ul>");
  });

  it("converts ordered lists", () => {
    const result = markdownToHtml("1. First\n2. Second\n3. Third");
    expect(result.content).toContain("<ol>");
    expect(result.content).toContain("<li>First</li>");
    expect(result.content).toContain("<li>Second</li>");
    expect(result.content).toContain("</ol>");
  });

  it("converts blockquotes", () => {
    const result = markdownToHtml("> This is a quote");
    expect(result.content).toContain("<blockquote>");
    expect(result.content).toContain("This is a quote");
    expect(result.content).toContain("</blockquote>");
  });

  it("converts horizontal rules", () => {
    const result = markdownToHtml("---");
    expect(result.content).toContain("<hr>");
  });

  it("converts mixed content", () => {
    const md = "# Title\n\nSome **bold** and *italic* text.\n\n- Item 1\n- Item 2";
    const result = markdownToHtml(md);
    expect(result.content).toContain("<h1>Title</h1>");
    expect(result.content).toContain("<strong>bold</strong>");
    expect(result.content).toContain("<em>italic</em>");
    expect(result.content).toContain("<ul>");
    expect(result.content).toContain("<li>Item 1</li>");
  });

  it("escapes HTML in code blocks", () => {
    const result = markdownToHtml("```\n<div>hello</div>\n```");
    expect(result.content).toContain("&lt;div&gt;hello&lt;/div&gt;");
  });

  it("tracks source and target sizes", () => {
    const result = markdownToHtml("# Hi");
    expect(result.sourceSize).toBe(4);
    expect(result.targetSize).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// htmlToText
// ---------------------------------------------------------------------------

describe("htmlToText", () => {
  it("strips HTML tags", () => {
    const result = htmlToText("<p>Hello <strong>World</strong></p>");
    expect(result.content).toBe("Hello World");
    expect(result.sourceFormat).toBe("html");
    expect(result.targetFormat).toBe("text");
  });

  it("decodes HTML entities", () => {
    const result = htmlToText("&amp; &lt; &gt; &quot; &#39;");
    expect(result.content).toBe('& < > " \'');
  });

  it("decodes &nbsp;", () => {
    const result = htmlToText("Hello&nbsp;World");
    expect(result.content).toBe("Hello World");
  });

  it("handles nested tags", () => {
    const result = htmlToText(
      "<div><p>Paragraph <em>with <strong>nested</strong> tags</em></p></div>",
    );
    expect(result.content).toContain("Paragraph with nested tags");
  });

  it("removes script and style content", () => {
    const result = htmlToText(
      "<p>Keep</p><script>alert('x')</script><style>.x{}</style><p>This</p>",
    );
    expect(result.content).not.toContain("alert");
    expect(result.content).not.toContain(".x{}");
    expect(result.content).toContain("Keep");
    expect(result.content).toContain("This");
  });

  it("normalizes whitespace", () => {
    const result = htmlToText("<p>  Hello   World  </p>");
    expect(result.content).toBe("Hello World");
  });

  it("handles empty input", () => {
    const result = htmlToText("");
    expect(result.content).toBe("");
  });
});

// ---------------------------------------------------------------------------
// csvToJson
// ---------------------------------------------------------------------------

describe("csvToJson", () => {
  it("converts basic CSV to JSON", () => {
    const result = csvToJson("name,age\nAlice,30\nBob,25");
    const data = JSON.parse(result.content);
    expect(data).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
    expect(result.sourceFormat).toBe("csv");
    expect(result.targetFormat).toBe("json");
  });

  it("handles tab-delimited CSV", () => {
    const result = csvToJson("name\tage\nAlice\t30", "\t");
    const data = JSON.parse(result.content);
    expect(data).toEqual([{ name: "Alice", age: "30" }]);
  });

  it("handles quoted fields with commas", () => {
    const result = csvToJson('name,location\nAlice,"New York, NY"\nBob,LA');
    const data = JSON.parse(result.content);
    expect(data[0].location).toBe("New York, NY");
    expect(data[1].location).toBe("LA");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const result = csvToJson('name,quote\nAlice,"say ""hello"""\nBob,hi');
    const data = JSON.parse(result.content);
    expect(data[0].quote).toBe('say "hello"');
  });

  it("handles empty input", () => {
    const result = csvToJson("");
    expect(result.content).toBe("[]");
  });

  it("handles header-only CSV", () => {
    const result = csvToJson("name,age");
    const data = JSON.parse(result.content);
    expect(data).toEqual([]);
  });

  it("roundtrips with jsonToCsv", () => {
    const csv = "name,age\nAlice,30\nBob,25";
    const jsonResult = csvToJson(csv);
    const csvResult = jsonToCsv(jsonResult.content);
    // Parse both back for comparison
    const original = JSON.parse(jsonResult.content);
    const roundtripped = JSON.parse(csvToJson(csvResult.content).content);
    expect(roundtripped).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// jsonToCsv
// ---------------------------------------------------------------------------

describe("jsonToCsv", () => {
  it("converts basic JSON array to CSV", () => {
    const result = jsonToCsv('[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]');
    const lines = result.content.split("\n");
    expect(lines[0]).toBe("name,age");
    expect(lines[1]).toBe("Alice,30");
    expect(lines[2]).toBe("Bob,25");
    expect(result.sourceFormat).toBe("json");
    expect(result.targetFormat).toBe("csv");
  });

  it("handles nested values by stringifying", () => {
    const result = jsonToCsv('[{"name":"Alice","meta":{"role":"admin"}}]');
    const lines = result.content.split("\n");
    expect(lines[0]).toBe("name,meta");
    // Nested object should be JSON-stringified and quoted
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).toContain("role");
  });

  it("returns empty string for empty array", () => {
    const result = jsonToCsv("[]");
    expect(result.content).toBe("");
  });

  it("collects all unique keys across objects", () => {
    const result = jsonToCsv('[{"a":"1"},{"b":"2"},{"a":"3","c":"4"}]');
    const lines = result.content.split("\n");
    expect(lines[0]).toBe("a,b,c");
  });
});

// ---------------------------------------------------------------------------
// csvToTable
// ---------------------------------------------------------------------------

describe("csvToTable", () => {
  it("parses headers and rows", () => {
    const table = csvToTable("Name,Age,City\nAlice,30,NYC\nBob,25,LA");
    expect(table.headers).toEqual(["Name", "Age", "City"]);
    expect(table.rows).toEqual([
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"],
    ]);
  });

  it("returns correct counts", () => {
    const table = csvToTable("A,B\n1,2\n3,4\n5,6");
    expect(table.rowCount).toBe(3);
    expect(table.columnCount).toBe(2);
  });

  it("handles empty input", () => {
    const table = csvToTable("");
    expect(table.headers).toEqual([]);
    expect(table.rows).toEqual([]);
    expect(table.rowCount).toBe(0);
    expect(table.columnCount).toBe(0);
  });

  it("handles semicolon delimiter", () => {
    const table = csvToTable("a;b\n1;2", ";");
    expect(table.headers).toEqual(["a", "b"]);
    expect(table.rows).toEqual([["1", "2"]]);
  });
});

// ---------------------------------------------------------------------------
// csvToMarkdown
// ---------------------------------------------------------------------------

describe("csvToMarkdown", () => {
  it("creates proper pipe-formatted table", () => {
    const result = csvToMarkdown("Name,Age\nAlice,30\nBob,25");
    const lines = result.content.split("\n");
    expect(lines.length).toBe(4); // header + separator + 2 data rows
    expect(lines[0]).toContain("| Name");
    expect(lines[0]).toContain("| Age");
    expect(lines[1]).toMatch(/\| -+ \| -+ \|/);
    expect(lines[2]).toContain("Alice");
    expect(lines[3]).toContain("Bob");
    expect(result.sourceFormat).toBe("csv");
    expect(result.targetFormat).toBe("markdown");
  });

  it("has alignment row with dashes", () => {
    const result = csvToMarkdown("A,B\n1,2");
    const lines = result.content.split("\n");
    // Second line should be separator
    expect(lines[1]).toMatch(/^\| -+ \| -+ \|$/);
  });

  it("handles empty input", () => {
    const result = csvToMarkdown("");
    expect(result.content).toBe("");
  });
});

// ---------------------------------------------------------------------------
// csvToHtml
// ---------------------------------------------------------------------------

describe("csvToHtml", () => {
  it("creates proper table structure", () => {
    const result = csvToHtml("Name,Age\nAlice,30");
    expect(result.content).toContain("<table>");
    expect(result.content).toContain("<thead>");
    expect(result.content).toContain("<tbody>");
    expect(result.content).toContain("<th>Name</th>");
    expect(result.content).toContain("<th>Age</th>");
    expect(result.content).toContain("<td>Alice</td>");
    expect(result.content).toContain("<td>30</td>");
    expect(result.content).toContain("</table>");
    expect(result.sourceFormat).toBe("csv");
    expect(result.targetFormat).toBe("html");
  });

  it("escapes HTML entities in cells", () => {
    const result = csvToHtml('Header\n<script>alert("xss")</script>');
    expect(result.content).toContain("&lt;script&gt;");
    expect(result.content).not.toContain("<script>");
  });

  it("handles empty input", () => {
    const result = csvToHtml("");
    expect(result.content).toBe("<table></table>");
  });
});

// ---------------------------------------------------------------------------
// jsonToYaml
// ---------------------------------------------------------------------------

describe("jsonToYaml", () => {
  it("converts simple object", () => {
    const result = jsonToYaml('{"name":"Alice","age":30}');
    expect(result.content).toContain("name: Alice");
    expect(result.content).toContain("age: 30");
    expect(result.sourceFormat).toBe("json");
    expect(result.targetFormat).toBe("yaml");
  });

  it("converts nested object", () => {
    const result = jsonToYaml('{"server":{"host":"localhost","port":8080}}');
    expect(result.content).toContain("server:");
    expect(result.content).toContain("  host: localhost");
    expect(result.content).toContain("  port: 8080");
  });

  it("converts array values", () => {
    const result = jsonToYaml('{"tags":["a","b","c"]}');
    expect(result.content).toContain("tags:");
    expect(result.content).toContain("  - a");
    expect(result.content).toContain("  - b");
    expect(result.content).toContain("  - c");
  });

  it("handles booleans and null", () => {
    const result = jsonToYaml('{"active":true,"deleted":false,"data":null}');
    expect(result.content).toContain("active: true");
    expect(result.content).toContain("deleted: false");
    expect(result.content).toContain("data: null");
  });

  it("handles top-level array", () => {
    const result = jsonToYaml('[1,2,3]');
    expect(result.content).toContain("- 1");
    expect(result.content).toContain("- 2");
    expect(result.content).toContain("- 3");
  });

  it("quotes strings with special characters", () => {
    const result = jsonToYaml('{"key":"value: with colon"}');
    expect(result.content).toContain('"value: with colon"');
  });

  it("quotes reserved words", () => {
    const result = jsonToYaml('{"key":"true"}');
    expect(result.content).toContain('"true"');
  });

  it("handles nested arrays of objects", () => {
    const result = jsonToYaml('{"people":[{"name":"Alice"},{"name":"Bob"}]}');
    expect(result.content).toContain("people:");
    expect(result.content).toContain("  -");
    expect(result.content).toContain("name: Alice");
    expect(result.content).toContain("name: Bob");
  });
});

// ---------------------------------------------------------------------------
// textToHtml
// ---------------------------------------------------------------------------

describe("textToHtml", () => {
  it("wraps paragraphs in p tags", () => {
    const result = textToHtml("First paragraph.\n\nSecond paragraph.");
    expect(result.content).toBe(
      "<p>First paragraph.</p>\n<p>Second paragraph.</p>",
    );
    expect(result.sourceFormat).toBe("text");
    expect(result.targetFormat).toBe("html");
  });

  it("handles single line", () => {
    const result = textToHtml("Just one line.");
    expect(result.content).toBe("<p>Just one line.</p>");
  });

  it("handles empty input", () => {
    const result = textToHtml("");
    expect(result.content).toBe("");
  });

  it("handles whitespace-only input", () => {
    const result = textToHtml("   \n\n   ");
    expect(result.content).toBe("");
  });

  it("escapes HTML entities in text", () => {
    const result = textToHtml("Use <div> & 'quotes'");
    expect(result.content).toContain("&lt;div&gt;");
    expect(result.content).toContain("&amp;");
    expect(result.content).toContain("&#39;quotes&#39;");
  });

  it("converts single newlines to <br>", () => {
    const result = textToHtml("Line one\nLine two");
    expect(result.content).toBe("<p>Line one<br>Line two</p>");
  });
});

// ---------------------------------------------------------------------------
// htmlToMarkdown
// ---------------------------------------------------------------------------

describe("htmlToMarkdown", () => {
  it("converts headings", () => {
    const result = htmlToMarkdown("<h1>Title</h1><h2>Subtitle</h2>");
    expect(result.content).toContain("# Title");
    expect(result.content).toContain("## Subtitle");
    expect(result.sourceFormat).toBe("html");
    expect(result.targetFormat).toBe("markdown");
  });

  it("converts links", () => {
    const result = htmlToMarkdown('<a href="https://example.com">Link</a>');
    expect(result.content).toContain("[Link](https://example.com)");
  });

  it("converts bold and italic", () => {
    const result = htmlToMarkdown("<strong>Bold</strong> and <em>Italic</em>");
    expect(result.content).toContain("**Bold**");
    expect(result.content).toContain("*Italic*");
  });

  it("converts b and i tags", () => {
    const result = htmlToMarkdown("<b>Bold</b> and <i>Italic</i>");
    expect(result.content).toContain("**Bold**");
    expect(result.content).toContain("*Italic*");
  });

  it("converts unordered lists", () => {
    const result = htmlToMarkdown("<ul><li>One</li><li>Two</li></ul>");
    expect(result.content).toContain("- One");
    expect(result.content).toContain("- Two");
  });

  it("converts ordered lists", () => {
    const result = htmlToMarkdown("<ol><li>First</li><li>Second</li></ol>");
    // Our simple converter uses - for all list items
    expect(result.content).toContain("- First");
    expect(result.content).toContain("- Second");
  });

  it("converts inline code", () => {
    const result = htmlToMarkdown("Use <code>console.log</code> to debug");
    expect(result.content).toContain("`console.log`");
  });

  it("converts pre/code blocks", () => {
    const result = htmlToMarkdown("<pre><code>const x = 1;</code></pre>");
    expect(result.content).toContain("```");
    expect(result.content).toContain("const x = 1;");
  });

  it("converts images", () => {
    const result = htmlToMarkdown('<img src="photo.jpg" alt="A photo">');
    expect(result.content).toContain("![A photo](photo.jpg)");
  });

  it("converts blockquotes", () => {
    const result = htmlToMarkdown("<blockquote>A wise quote</blockquote>");
    expect(result.content).toContain("> A wise quote");
  });

  it("converts paragraphs", () => {
    const result = htmlToMarkdown("<p>Hello</p><p>World</p>");
    expect(result.content).toContain("Hello");
    expect(result.content).toContain("World");
  });

  it("removes script and style tags", () => {
    const result = htmlToMarkdown(
      "<p>Keep</p><script>alert('x')</script><style>.x{}</style>",
    );
    expect(result.content).not.toContain("alert");
    expect(result.content).not.toContain(".x{}");
    expect(result.content).toContain("Keep");
  });

  it("decodes HTML entities", () => {
    const result = htmlToMarkdown("<p>A &amp; B &lt; C</p>");
    expect(result.content).toContain("A & B < C");
  });
});
