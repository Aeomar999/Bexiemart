const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const hasImport = /import\s+{[^}]*BackButton[^}]*}\s+from\s+['\"].*['\"]/.test(content) || /import\s+BackButton\s+from/.test(content);
      if (content.includes('<BackButton') && !hasImport) {
        // add import at the top after other imports
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        lines.splice(lastImportIndex + 1, 0, 'import { BackButton } from "@/components/ui/BackButton";');
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log('Added import to', fullPath);
      }
    }
  }
}

processDir('./app');
