const fs = require('fs');
const path = require('path');

function markdownToHTML(markdown) {
  let html = markdown;

  const codeBlocks = [];
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<div class="code-block"><pre><code>${code}</code></pre></div>`);
    return placeholder;
  });

  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  html = html
    .split('\n\n')
    .map((p) => {
      if (p.match(/^<(h[1-6]|div|ul|code)/)) return p;
      if (p.includes('__CODE_BLOCK_')) return p;
      if (p.trim() === '') return '';

      if (p.includes('<li>')) {
        return `<ul>${p}</ul>`;
      }

      return `<p>${p.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  codeBlocks.forEach((block, i) => {
    html = html.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return html;
}

function createNavigation(currentPage) {
  const pages = [
    { id: 'index', title: 'Главная', file: 'index.html' },
    { id: 'styleguide', title: 'Стайлгайд', file: 'styleguide.html' },
    { id: 'profiles', title: 'Профили', file: 'profiles.html' },
  ];

  const nav = pages
    .map((page) => {
      const isActive = page.id === currentPage;
      const activeClass = isActive ? ' class="active"' : '';
      return `<a href="${page.file}"${activeClass}>${page.title}</a>`;
    })
    .join('\n                ');

  // Add external link to rules
  const rulesLink = `<a href="https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/README_RULES_RU.md" target="_blank">Правила <span style="font-size: 0.8em;">↗</span></a>`;

  return `${nav}\n                ${rulesLink}`;
}

function createHTMLPage(title, content, pageId, enLink) {
  const navigation = createNavigation(pageId);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - @ytvee-dev/eslint-config-react</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="sidebar">
        <div class="logo">
            <h2>ESLint Config</h2>
            <p>@ytvee-dev/eslint-config-react</p>
        </div>
        <nav class="nav">
            ${navigation}
        </nav>
        <div class="lang-switch">
            <a href="${enLink}" target="_blank" class="en-link">🇬🇧 English version</a>
        </div>
        <div class="footer-links">
            <a href="https://github.com/ytvee-dev/eslint-config-react" target="_blank">GitHub</a>
            <a href="https://www.npmjs.com/package/@ytvee-dev/eslint-config-react" target="_blank">NPM</a>
        </div>
    </div>
    
    <div class="main-content">
        <div class="content">
            ${content}
        </div>
        
        <footer class="footer">
            <p>
                <a href="https://github.com/ytvee-dev/eslint-config-react/blob/main/LICENSE" target="_blank">MIT License</a>
            </p>
        </footer>
    </div>
</body>
</html>`;
}

const docs = [
  {
    input: '../README_RU.md',
    output: 'docbook/index.html',
    title: 'Главная',
    pageId: 'index',
    enLink: 'https://github.com/ytvee-dev/eslint-config-react/blob/main/README.md',
  },
  {
    input: 'README_STYLEGUIDE_RU.md',
    output: 'docbook/styleguide.html',
    title: 'Стайлгайд линтера',
    pageId: 'styleguide',
    enLink: 'https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/README_STYLEGUIDE.md',
  },
  {
    input: 'PROFILES_RU.md',
    output: 'docbook/profiles.html',
    title: 'Руководство по профилям',
    pageId: 'profiles',
    enLink: 'https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/PROFILES.md',
  },
];

const docsDir = path.join(__dirname, 'docs');
const outputDir = path.join(docsDir, 'docbook');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

docs.forEach((doc) => {
  const inputPath = path.join(docsDir, doc.input);
  const outputPath = path.join(docsDir, doc.output);

  const markdown = fs.readFileSync(inputPath, 'utf8');
  const htmlContent = markdownToHTML(markdown);
  const fullHTML = createHTMLPage(doc.title, htmlContent, doc.pageId, doc.enLink);

  fs.writeFileSync(outputPath, fullHTML);
});

// Create main page for docs root with adjusted paths
const mainDoc = docs.find((d) => d.pageId === 'index');
const mainMarkdown = fs.readFileSync(path.join(docsDir, mainDoc.input), 'utf8');
const mainHtmlContent = markdownToHTML(mainMarkdown);

// Adjust navigation and styles path for root index
const mainPageHTML = createHTMLPage(mainDoc.title, mainHtmlContent, mainDoc.pageId, mainDoc.enLink)
  .replace('href="index.html"', 'href="index.html"')
  .replace('href="styleguide.html"', 'href="docbook/styleguide.html"')
  .replace('href="profiles.html"', 'href="docbook/profiles.html"')
  .replace('href="styles.css"', 'href="docbook/styles.css"');

fs.writeFileSync(path.join(docsDir, 'index.html'), mainPageHTML);
