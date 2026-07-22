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
            if (file.endsWith('.service.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const services = walk(path.join(__dirname, 'src'));

for (const f of services) {
    let content = fs.readFileSync(f, 'utf8');
    
    // We are looking for something like:
    // return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    // and replacing it with:
    // return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };

    // Standard pattern
    const regex1 = /return\s*{\s*data,\s*total,\s*page,\s*limit,\s*totalPages([^}]+)\s*};/g;
    if (regex1.test(content)) {
        content = content.replace(regex1, 'return { data, meta: { total, page, limit, totalPages$1 } };');
        fs.writeFileSync(f, content);
        console.log(`Updated pagination in ${path.basename(f)}`);
    }

    const regex2 = /return\s*{\s*data:\s*([a-zA-Z0-9_]+),\s*total,\s*page,\s*limit,\s*totalPages([^}]+)\s*};/g;
    if (regex2.test(content)) {
        content = content.replace(regex2, 'return { data: $1, meta: { total, page, limit, totalPages$2 } };');
        fs.writeFileSync(f, content);
        console.log(`Updated pagination (data mapping) in ${path.basename(f)}`);
    }

    // specific pattern for dispatcher.service.ts which has data: { rides, deliveries: [] }
    const regex3 = /return\s*{\s*data:\s*{([^}]+)},\s*total,\s*page,\s*limit,\s*totalPages([^}]+)\s*};/g;
    if (regex3.test(content)) {
        content = content.replace(regex3, 'return { data: { $1 }, meta: { total, page, limit, totalPages$2 } };');
        fs.writeFileSync(f, content);
        console.log(`Updated pagination (data obj mapping) in ${path.basename(f)}`);
    }
}
