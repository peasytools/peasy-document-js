Output demo.gif

Set Shell zsh
Set Width 900
Set Height 550
Set FontSize 14
Set Padding 15
Set TypingSpeed 40ms

Type `node`
Enter
Sleep 1s

Type `const doc = await import('./dist/index.js')`
Enter
Sleep 1s

Type `// Markdown to HTML`
Enter
Sleep 300ms
Type `doc.markdownToHtml('# Hello\\n\\nThis is **bold** and *italic*.')`
Enter
Sleep 1.5s

Type `// CSV to JSON`
Enter
Sleep 300ms
Type `doc.csvToJson('name,age\\nAlice,30\\nBob,25')`
Enter
Sleep 1.5s

Type `// HTML to Markdown`
Enter
Sleep 300ms
Type `doc.htmlToMarkdown('<h1>Title</h1><p>A <strong>bold</strong> paragraph.</p>')`
Enter
Sleep 1.5s

Type `// JSON to YAML`
Enter
Sleep 300ms
Type `doc.jsonToYaml('{"name": "Alice", "skills": ["TypeScript", "Python"]}')`
Enter
Sleep 2s

Type `.exit`
Enter
Sleep 500ms
