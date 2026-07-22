const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.spec.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const tests = walk(path.join(__dirname, 'src'));

for (const f of tests) {
    let content = fs.readFileSync(f, 'utf8');
    let updated = false;

    const replacements = [
        ['result.total', 'result.meta.total'],
        ['result.page', 'result.meta.page'],
        ['result.limit', 'result.meta.limit'],
        ['result.totalPages', 'result.meta.totalPages'],
        ['result.pages', 'result.meta.totalPages'], // products uses result.pages
        ['result.pageSize', 'result.meta.limit'], // chat uses result.pageSize
    ];

    for (const [find, replace] of replacements) {
        if (content.includes(find)) {
            content = content.replaceAll(find, replace);
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(f, content);
        console.log(`Updated tests in ${path.basename(f)}`);
    }
}
