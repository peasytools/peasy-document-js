/**
 * peasy-document — Document conversion library for Markdown, HTML, CSV, JSON, and YAML.
 *
 * Zero dependencies. TypeScript-first. Pure string processing.
 */

export type { ConversionResult, TableData } from "./types.js";

export {
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
} from "./engine.js";
