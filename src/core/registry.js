import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

export function getTemplates() {
  const templatesDir = join(ROOT, 'templates');
  const dirs = getSubdirs(templatesDir).filter(d => !d.startsWith('_'));
  const templates = [];

  for (const dir of dirs) {
    const metaPath = join(templatesDir, dir, 'template.json');
    if (!existsSync(metaPath)) continue;

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    templates.push({ ...meta, id: dir, path: join(templatesDir, dir) });
  }

  return templates;
}

export function getLayers() {
  const layersDir = join(ROOT, 'layers');
  const dirs = getSubdirs(layersDir);
  const layers = [];

  for (const dir of dirs) {
    const metaPath = join(layersDir, dir, 'layer.json');
    if (!existsSync(metaPath)) continue;

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    layers.push({ ...meta, id: dir, path: join(layersDir, dir) });
  }

  return layers;
}

export function getCompatibleLayers(templateId) {
  const templates = getTemplates();
  const tmpl = templates.find(t => t.id === templateId);
  if (!tmpl) return [];

  const allLayers = getLayers();
  return allLayers.filter(l => (tmpl.compatibleLayers || []).includes(l.id));
}

function getSubdirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(entry =>
    statSync(join(dir, entry)).isDirectory()
  );
}
