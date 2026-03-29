import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import ejs from 'ejs';

export function renderTemplate(templateDir, variables) {
  const files = [];
  walkDir(templateDir, templateDir, files);

  const rendered = [];
  for (const file of files) {
    const content = readFileSync(file.absolute, 'utf-8');
    const renderedContent = safeRender(content, variables, {
      filename: file.absolute,
    });

    let outputPath = interpolatePath(file.relative, variables);
    if (outputPath.endsWith('.ejs')) {
      outputPath = outputPath.slice(0, -4);
    }

    // Skip files that render to empty (conditional templates like SecurityConfig)
    if (renderedContent.trim()) {
      rendered.push({ path: outputPath, content: renderedContent });
    }
  }

  return rendered;
}

export function renderLayerAdditions(layerDir, variables) {
  const addDir = join(layerDir, 'add');
  if (!existsSync(addDir)) return [];
  return renderTemplate(addDir, variables);
}

export function getLayerMerges(layerDir, variables) {
  const mergeDir = join(layerDir, 'merge');
  if (!existsSync(mergeDir)) return [];

  const files = [];
  walkDir(mergeDir, mergeDir, files);

  return files.map(file => {
    const content = readFileSync(file.absolute, 'utf-8');
    const rendered = safeRender(content, variables, { filename: file.absolute });

    let outputPath = interpolatePath(file.relative, variables);
    if (outputPath.endsWith('.ejs')) outputPath = outputPath.slice(0, -4);

    return { path: outputPath, content: rendered };
  });
}

// EJS uses with(data){} so undefined vars throw ReferenceError.
// Retry with the missing var set to '' — avoids fragile Proxy+with interactions.
function safeRender(content, variables, options) {
  const vars = { ...variables };
  for (let i = 0; i < 10; i++) {
    try {
      return ejs.render(content, vars, options);
    } catch (err) {
      const match = err.message.match(/(\w+) is not defined/);
      if (match) {
        vars[match[1]] = '';
        continue;
      }
      throw err;
    }
  }
  return ejs.render(content, vars, options);
}

function interpolatePath(filePath, variables) {
  let normalized = filePath.replace(/\\/g, '/');
  return normalized.replace(/__([a-zA-Z]+)__/g, (match, varName) => {
    return variables[varName] !== undefined ? variables[varName] : match;
  });
}

function walkDir(baseDir, currentDir, results) {
  for (const entry of readdirSync(currentDir)) {
    const fullPath = join(currentDir, entry);
    if (statSync(fullPath).isDirectory()) {
      walkDir(baseDir, fullPath, results);
    } else {
      results.push({ absolute: fullPath, relative: relative(baseDir, fullPath) });
    }
  }
}
