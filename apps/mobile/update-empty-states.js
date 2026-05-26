const fs = require('fs');
const path = require('path');
function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) replaceInDir(full);
    else if (full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('EmptyState') && (content.includes('iconColor') || content.includes('iconBgColor'))) {
        content = content.replace(/\s*iconColor=\{[^}]+\}/g, '');
        content = content.replace(/\s*iconColor="[^"]+"/g, '');
        content = content.replace(/\s*iconColor='[^']+'/g, '');
        content = content.replace(/\s*iconBgColor=\{[^}]+\}/g, '');
        content = content.replace(/\s*iconBgColor="[^"]+"/g, '');
        content = content.replace(/\s*iconBgColor='[^']+'/g, '');
        fs.writeFileSync(full, content);
        console.log('Updated ' + full);
      }
    }
  }
}
replaceInDir('c:/Users/Jerry/Desktop/Bexiemart/apps/mobile/app');
