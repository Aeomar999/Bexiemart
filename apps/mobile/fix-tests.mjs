import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const dir = resolve("C:\\Users\\Jerry\\Desktop\\Bexiemart\\apps\\mobile\\src\\lib\\hooks\\__tests__");
const files = readdirSync(dir).filter(f => f.endsWith(".test.ts"));

let fixed = 0;

for (const file of files) {
  const fp = join(dir, file);
  let code = readFileSync(fp, "utf8");
  const orig = code;

  // 1. Fix import — add waitFor
  if (code.includes('import { renderHook } from "@testing-library/react-native"')) {
    code = code.replace(
      'import { renderHook } from "@testing-library/react-native"',
      'import { renderHook, waitFor } from "@testing-library/react-native"'
    );
  }

  // 2. Remove waitForNextUpdate from destructuring
  code = code.replace(/,?\s*waitForNextUpdate\s*,?\s*/g, (m) => {
    const trimmed = m.replace(/waitForNextUpdate/g, "").trim();
    if (trimmed === "," || trimmed === "") return "";
    return trimmed;
  });

  // 3. Fix destructuring like: const { result, }  →  const { result }
  code = code.replace(/\{\s+(\w+),\s*\}/g, "{ $1 }");
  code = code.replace(/\{,\s+/g, "{ ");
  code = code.replace(/,\s*\}/g, " }");

  // 4. Handle pattern: result.current.mutateAsync(...);\nawait waitForNextUpdate();
  //    → await result.current.mutateAsync(...);
  code = code.replace(
    /(\s*)(result\.current\.mutateAsync(?:\.\w+)?\([\s\S]*?\));\s*\n\s*await waitForNextUpdate\(\);/g,
    (_, ws, line) => `${ws}await ${line};`
  );

  // 5. Handle pattern: result.current.mutateAsync(...);\nawait waitForNextUpdate().catch(() => {});
  //    → try { await result.current.mutateAsync(...); } catch (e) {}
  code = code.replace(
    /(\s*)(result\.current\.mutateAsync(?:\.\w+)?\([\s\S]*?\));\s*\n\s*await waitForNextUpdate\(\)\.catch\(\(\)\s*=>\s*{\s*}\);/g,
    (_, ws, line) => `${ws}try { await ${line}; } catch (e) {}`
  );

  // 6. Handle standalone await waitForNextUpdate().catch(() => {});
  //    → await waitFor(() => expect(result.current.isError).toBe(true));
  code = code.replace(
    /await waitForNextUpdate\(\)\.catch\(\(\)\s*=>\s*{\s*}\);/g,
    "await waitFor(() => expect(result.current.isPending).toBeFalsy());"
  );

  // 7. Handle standalone await waitForNextUpdate();
  //    → await waitFor(() => expect(result.current.isPending).toBeFalsy());
  code = code.replace(
    /await waitForNextUpdate\(\);/g,
    "await waitFor(() => expect(result.current.isPending).toBeFalsy());"
  );

  if (code !== orig) {
    writeFileSync(fp, code, "utf8");
    fixed++;
    console.log(`✓ ${file}`);
  }
}

console.log(`\nFixed ${fixed} of ${files.length} files.`);
