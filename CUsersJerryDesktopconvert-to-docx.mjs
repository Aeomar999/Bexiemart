import { readFileSync, writeFileSync } from 'fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, ExternalHyperlink,
  convertInchesToTwip, LevelFormat, NumberFormat
} from 'docx';

const COLORS = {
  brand: '1a1a2e',
  accent: 'e94560',
  headerBg: '1a1a2e',
  headerText: 'ffffff',
  lightGray: 'f5f5f5',
  border: 'cccccc',
  text: '333333',
  muted: '666666',
};

function parseInline(text) {
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), font: 'Calibri', size: 22, color: COLORS.text }));
    }
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true, font: 'Calibri', size: 22, color: COLORS.text }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], font: 'Consolas', size: 20, color: 'c7254e', shading: { type: ShadingType.CLEAR, fill: 'f9f2f4' } }));
    } else if (match[4] && match[5]) {
      runs.push(new ExternalHyperlink({ children: [new TextRun({ text: match[4], style: 'Hyperlink', font: 'Calibri', size: 22 })], link: match[5] }));
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), font: 'Calibri', size: 22, color: COLORS.text }));
  }
  return runs.length ? runs : [new TextRun({ text, font: 'Calibri', size: 22, color: COLORS.text })];
}

function parseTable(lines) {
  const rows = lines.filter(l => !l.match(/^\|[\s-:|]+\|$/));
  if (rows.length === 0) return null;
  const parsed = rows.map(r => r.split('|').slice(1, -1).map(c => c.trim()));
  const colCount = Math.max(...parsed.map(r => r.length));
  const colWidth = Math.floor(9000 / colCount);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: parsed.map((row, rowIdx) =>
      new TableRow({
        tableHeader: rowIdx === 0,
        children: Array.from({ length: colCount }, (_, i) =>
          new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            shading: rowIdx === 0 ? { type: ShadingType.CLEAR, fill: COLORS.headerBg } : (rowIdx % 2 === 0 ? { type: ShadingType.CLEAR, fill: COLORS.lightGray } : undefined),
            children: [new Paragraph({
              children: rowIdx === 0
                ? [new TextRun({ text: row[i] || '', bold: true, font: 'Calibri', size: 20, color: COLORS.headerText })]
                : parseInline(row[i] || ''),
              spacing: { before: 40, after: 40 },
            })],
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
          })
        ),
      })
    ),
  });
}

function markdownToDocx(markdown, title) {
  const lines = markdown.split('\n');
  const children = [];
  let i = 0;

  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, font: 'Calibri', size: 36, color: COLORS.brand })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 100 },
  }));

  children.push(new Paragraph({
    border: { bottom: { color: COLORS.accent, space: 1, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { after: 300 },
  }));

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    if (line.match(/^---+$/)) {
      children.push(new Paragraph({
        border: { bottom: { color: COLORS.border, space: 1, style: BorderStyle.SINGLE, size: 1 } },
        spacing: { before: 200, after: 200 },
      }));
      i++; continue;
    }

    if (line.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseTable(tableLines);
      if (table) {
        children.push(new Paragraph({ text: '', spacing: { before: 100 } }));
        children.push(table);
        children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      }
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const sizes = { 1: 32, 2: 28, 3: 26, 4: 24, 5: 22, 6: 22 };
      const headingLevels = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      children.push(new Paragraph({
        children: [new TextRun({ text, bold: true, font: 'Calibri', size: sizes[level] || 22, color: level <= 2 ? COLORS.brand : COLORS.text })],
        heading: headingLevels[level] || HeadingLevel.HEADING_4,
        spacing: { before: level <= 2 ? 300 : 200, after: 100 },
      }));
      i++; continue;
    }

    if (line.match(/^\s*[-*]\s+/)) {
      const indent = line.match(/^(\s*)/)[1].length;
      const text = line.replace(/^\s*[-*]\s+/, '');
      const bullet = indent > 2 ? '\u25E6' : '\u2022';
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${bullet} `, font: 'Calibri', size: 22, color: COLORS.accent }),
          ...parseInline(text),
        ],
        indent: { left: convertInchesToTwip(0.25 + indent * 0.15) },
        spacing: { before: 40, after: 40 },
      }));
      i++; continue;
    }

    if (line.match(/^\s*\d+\.\s+/)) {
      const num = line.match(/^\s*(\d+)\./)[1];
      const text = line.replace(/^\s*\d+\.\s+/, '');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${num}. `, bold: true, font: 'Calibri', size: 22, color: COLORS.accent }),
          ...parseInline(text),
        ],
        indent: { left: convertInchesToTwip(0.35) },
        spacing: { before: 40, after: 40 },
      }));
      i++; continue;
    }

    if (line.match(/^\s*-\s+\[[ x]\]\s+/)) {
      const checked = line.includes('[x]');
      const text = line.replace(/^\s*-\s+\[[ x]\]\s+/, '');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: checked ? '\u2611 ' : '\u2610 ', font: 'Calibri', size: 22 }),
          ...parseInline(text),
        ],
        indent: { left: convertInchesToTwip(0.35) },
        spacing: { before: 40, after: 40 },
      }));
      i++; continue;
    }

    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      children.push(new Paragraph({
        children: parseInline(text),
        indent: { left: convertInchesToTwip(0.5) },
        border: { left: { color: COLORS.accent, space: 4, style: BorderStyle.SINGLE, size: 12 } },
        spacing: { before: 100, after: 100 },
        shading: { type: ShadingType.CLEAR, fill: 'fef9f9' },
      }));
      i++; continue;
    }

    children.push(new Paragraph({
      children: parseInline(line),
      spacing: { before: 60, after: 60 },
    }));
    i++;
  }

  return new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: COLORS.text } },
        heading1: { run: { font: 'Calibri', size: 32, bold: true, color: COLORS.brand } },
        heading2: { run: { font: 'Calibri', size: 28, bold: true, color: COLORS.brand } },
        heading3: { run: { font: 'Calibri', size: 26, bold: true, color: COLORS.text } },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1200, right: 1200 },
        },
      },
      children,
    }],
  });
}

async function convert(inputPath, outputPath, title) {
  const md = readFileSync(inputPath, 'utf-8');
  const doc = markdownToDocx(md, title);
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outputPath, buffer);
  console.log('Created: ' + outputPath);
}

const base = 'C:\\Users\\Jerry\\Desktop';
await convert(
  base + '\\tech_report.md',
  base + '\\Bexiemart\\docs\\TECHNICAL_PRODUCTION_READINESS_REPORT.docx',
  'Bexiemart Technical Production Readiness Report'
);
await convert(
  base + '\\nontech_report.md',
  base + '\\Bexiemart\\docs\\NON_TECHNICAL_PRODUCTION_READINESS_REPORT.docx',
  'Bexiemart Non-Technical Production Readiness Report'
);
