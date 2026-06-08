import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const testDir = resolve('src/lib/hooks/__tests__');
const files = readdirSync(testDir).filter(f => f.endsWith('.test.ts'));

for (const file of files) {
  const fp = join(testDir, file);
  let content = readFileSync(fp, 'utf8');
  const orig = content;

  // 1. Fix mock closings: "jest.fn() } }));" → "jest.fn(),\n  },\n}));"
  content = content.replace(/jest\.fn\(\)\s*\}\s*\}\)\)/g, "jest.fn(),\n  },\n}));");

  // 2. Fix mutateAsync + await().catch(() => {}) → try { await ... } catch (e) {}
  content = content.replace(
    /(\s*)(result\.current\.mutateAsync\([^)]*\));\n\s*await\(\)\.catch\(\(\)\s*=>\s*{\s*}\);/g,
    (_, indent, call) => `${indent}try { await ${call}; } catch (e) {}`
  );

  // 3. Fix mutateAsync + await() → await mutateAsync()
  content = content.replace(
    /(\s*)(result\.current\.mutateAsync\([^)]*\));\n\s*await\(\);/g,
    (_, indent, call) => `${indent}await ${call};`
  );

  // 4. Fix standalone await(); → waitFor
  content = content.replace(/await\(\);/g, "await waitFor(() => expect(result.current.isPending).toBeFalsy());");

  // 5. Fix any remaining await().catch(() => {});
  content = content.replace(
    /await\(\)\.catch\(\(\)\s*=>\s*{\s*}\);/g,
    "await waitFor(() => expect(result.current.isPending).toBeFalsy());"
  );

  if (content !== orig) {
    writeFileSync(fp, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  } else {
    console.log(`  No change: ${file}`);
  }
}

console.log(`\nDone. Processed ${files.length} files.`);
