const fs = require('fs');

const files = [
  'app/(customer)/chats/[id].tsx',
  'app/(vendor)/chats/[id].tsx',
  'app/(dispatcher)/chats/[id].tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/c => c\.id === id/g, '(c: any) => c.id === id');
  content = content.replace(/useChatMessages/g, 'useChatMessages'); // Just ensuring it's there
  content = content.replace(/}, "chats"\)/g, '})');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
