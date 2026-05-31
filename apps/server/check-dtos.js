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
            if (file.endsWith('.dto.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dtos = walk(path.join(__dirname, 'src'));
const missing = [];

for (const f of dtos) {
    const content = fs.readFileSync(f, 'utf8');
    if (!content.includes('class-validator')) {
        missing.push(f);
    }
}

console.log(JSON.stringify(missing, null, 2));
