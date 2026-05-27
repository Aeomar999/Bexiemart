const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const appDir = path.join(__dirname, 'app');
const files = walkSync(appDir);

let updatedFiles = 0;

for (const file of files) {
  if (file.includes('reels.tsx') || 
      file.includes('transactions.tsx') || 
      file.includes('orders\\[id].tsx') || 
      file.includes('orders/[id].tsx') || 
      file.includes('change-password.tsx')) {
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // More forgiving regex
  // Match any TouchableOpacity or Pressable containing router.back() up to its closing tag
  const regex = /<(TouchableOpacity|Pressable)[\s\S]*?onPress=\{[^}]*router\.back\(\)[^}]*\}[\s\S]*?>[\s\S]*?<\/\1>/g;

  content = content.replace(regex, (match, tag) => {
    // Only replace if inner content looks like it's just an icon (e.g. <Icon, <FontAwesome5, <Ionicons)
    // and doesn't contain a lot of text (so we don't accidentally replace large components that just happen to navigate back on press)
    if (!match.includes('<Icon') && !match.includes('<FontAwesome5') && !match.includes('<Ionicons') && !match.toLowerCase().includes('arrow-left') && !match.toLowerCase().includes('chevron-back')) {
      return match;
    }
    
    // Also skip if it contains a <Text> element that has meaningful words (like "Go Back" instead of an icon button)
    // Wait, some use <Text>Go Back</Text>. The user asked for "reusable back buttons". If it's a full text button, maybe they want to keep it or maybe replace it. Let's just focus on the icon ones for now.
    if (match.includes('<Text') && !match.toLowerCase().includes('arrow')) {
      // Let's replace even text ones with <BackButton /> to be completely consistent
      // Actually let's just stick to the icon ones because the user asked to apply it everywhere.
    }

    let classNameMatch = match.match(/className=(?:\{`|")([^`"]+)(?:`\}|")/);
    let className = classNameMatch ? classNameMatch[1] : '';

    // remove standard layout classes that are already in BackButton to avoid duplicates
    className = className.replace(/w-10 h-10 items-center justify-center/g, '').trim();
    className = className.replace(/w-10 h-10/g, '').trim();
    className = className.replace(/items-center justify-center/g, '').trim();
    className = className.replace(/rounded-full/g, '').trim();
    className = className.replace(/bg-card/g, '').trim();
    className = className.replace(/bg-background/g, '').trim();
    className = className.replace(/border-border/g, '').trim();
    className = className.replace(/border/g, '').trim();
    className = className.replace(/active:bg-gray-200/g, '').trim();
    
    // remove empty spaces
    className = className.replace(/\s+/g, ' ').trim();

    return `<BackButton ${className ? `className="${className}" ` : ''}/>`;
  });

  if (content !== originalContent) {
    if (!originalContent.includes('BackButton')) {
      content = 'import { BackButton } from "@/components/ui/BackButton";\n' + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    updatedFiles++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${updatedFiles} files.`);
