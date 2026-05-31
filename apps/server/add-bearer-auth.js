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
            if (file.endsWith('.controller.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const controllers = walk(path.join(__dirname, 'src'));

for (const f of controllers) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Check if it uses AuthGuard or is a controller that should probably be authenticated
    // Wait, the safest is to just add ApiBearerAuth to ANY controller that has @UseGuards
    if (content.includes('@UseGuards') && !content.includes('@ApiBearerAuth()')) {
        // Add import
        if (content.includes('@nestjs/swagger')) {
            if (!content.includes('ApiBearerAuth')) {
                content = content.replace(/import\s+{([^}]*)}\s+from\s+["']@nestjs\/swagger["']/, (match, p1) => {
                    return `import { ${p1.trim()}, ApiBearerAuth } from "@nestjs/swagger"`;
                });
            }
        } else {
            content = `import { ApiBearerAuth } from "@nestjs/swagger";\n` + content;
        }

        // Add decorator before @Controller
        content = content.replace(/@Controller\([^)]*\)/, (match) => {
            return `@ApiBearerAuth()\n${match}`;
        });

        fs.writeFileSync(f, content);
        console.log(`Updated ${path.basename(f)}`);
    }
}
