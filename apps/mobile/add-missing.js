const fs = require('fs');
const files = [
  'app/(customer)/(tabs)/reels.tsx',
  'app/(customer)/wallet/transactions.tsx',
  'app/(vendor)/(orders)/[id].tsx',
  'app/(vendor)/(settings)/change-password.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { BackButton }')) {
    content = 'import { BackButton } from "@/components/ui/BackButton";\n' + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}
