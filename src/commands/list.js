import { getTemplates, getLayers } from '../core/registry.js';

export function listAction() {
  const templates = getTemplates();
  const layers = getLayers();

  console.log('\nAvailable templates:\n');
  for (const t of templates) {
    const layerNames = (t.compatibleLayers || []).join(', ');
    console.log(`  ${t.id}`);
    console.log(`    ${t.displayName} [${t.category}]`);
    if (layerNames) console.log(`    Layers: ${layerNames}`);
    console.log('');
  }

  console.log('Available layers:\n');
  for (const l of layers) {
    console.log(`  ${l.id}`);
    console.log(`    ${l.displayName}`);
    console.log('');
  }
}
