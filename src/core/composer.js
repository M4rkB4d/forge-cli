import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import deepmerge from 'deepmerge';
import { renderTemplate, renderLayerAdditions, getLayerMerges } from './renderer.js';
import { getTemplates, getLayers } from './registry.js';

/**
 * Composes a complete project from a base template + selected layers.
 * Returns an array of { path, content } representing every file.
 */
export function compose(config) {
  const { templateId, variables, layers: layerIds } = config;

  const template = getTemplates().find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  // 1. Render base template
  const baseDir = join(template.path, 'base');
  let files = renderTemplate(baseDir, variables);

  // 2. Apply each layer
  for (const layerId of layerIds) {
    const allLayers = getLayers();
    const layer = allLayers.find(l => l.id === layerId);
    if (!layer) {
      console.warn(`Layer not found: ${layerId}, skipping`);
      continue;
    }

    // Add new files from layer
    const additions = renderLayerAdditions(layer.path, variables);
    files = files.concat(additions);

    // Merge into existing files
    const merges = getLayerMerges(layer.path, variables);
    for (const mergeFile of merges) {
      const existing = files.find(f => f.path === mergeFile.path);
      if (!existing) {
        // No base file to merge into — treat as addition
        files.push(mergeFile);
        continue;
      }

      const strategy = detectMergeStrategy(mergeFile.path);
      existing.content = applyMerge(existing.content, mergeFile.content, strategy);
    }
  }

  return files;
}

function detectMergeStrategy(filePath) {
  if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) return 'yaml';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.xml') || filePath === 'pom.xml') return 'xml';
  return 'append';
}

function applyMerge(base, overlay, strategy) {
  switch (strategy) {
    case 'yaml':
      return mergeYaml(base, overlay);
    case 'json':
      return mergeJson(base, overlay);
    case 'xml':
      return mergeXml(base, overlay);
    case 'append':
    default:
      return base + '\n' + overlay;
  }
}

function mergeYaml(base, overlay) {
  const baseObj = parseYaml(base) || {};
  const overlayObj = parseYaml(overlay) || {};
  const merged = deepmerge(baseObj, overlayObj);
  return stringifyYaml(merged);
}

function mergeJson(base, overlay) {
  const baseObj = JSON.parse(base);
  const overlayObj = JSON.parse(overlay);
  const merged = deepmerge(baseObj, overlayObj);
  return JSON.stringify(merged, null, 2);
}

function mergeXml(base, overlay) {
  // Extract <dependency> blocks from the overlay
  const depRegex = /<dependency>[\s\S]*?<\/dependency>/g;
  const overlayDeps = overlay.match(depRegex);

  if (!overlayDeps || overlayDeps.length === 0) return base;

  // Find the FIRST closing </dependencies> tag (main deps, not dependencyManagement)
  const insertPoint = base.indexOf('</dependencies>');
  if (insertPoint === -1) {
    // No dependencies block — insert one before </project>
    const projectClose = base.lastIndexOf('</project>');
    const depsBlock = '\n    <dependencies>\n' +
      overlayDeps.map(d => '        ' + d.trim()).join('\n') +
      '\n    </dependencies>\n';
    return base.slice(0, projectClose) + depsBlock + base.slice(projectClose);
  }

  const insertion = overlayDeps.map(d => '        ' + d.trim()).join('\n') + '\n    ';
  return base.slice(0, insertPoint) + insertion + base.slice(insertPoint);
}
