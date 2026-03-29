import * as p from '@clack/prompts';
import { getTemplates, getCompatibleLayers } from './registry.js';

const CATEGORIES = [
  { value: 'backend', label: 'Backend Service' },
  { value: 'bff', label: 'BFF (Backend-for-Frontend)' },
  { value: 'frontend', label: 'Frontend Application' },
];

export async function promptUser(options = {}) {
  p.intro('Forge CLI');

  const category = await p.select({
    message: 'What are you building?',
    options: CATEGORIES,
  });
  if (p.isCancel(category)) return process.exit(0);

  const allTemplates = getTemplates();
  const filtered = allTemplates.filter(t => t.category === category);
  const templateId = filtered.length === 1
    ? filtered[0].id
    : await p.select({
        message: 'Which stack?',
        options: filtered.map(t => ({ value: t.id, label: t.displayName })),
      });
  if (p.isCancel(templateId)) return process.exit(0);

  const template = allTemplates.find(t => t.id === templateId);

  const projectName = options.name || await p.text({
    message: 'Project name',
    placeholder: 'my-service',
    validate: (val) => {
      if (!val) return 'Required';
      if (!/^[a-z][a-z0-9-]*$/.test(val)) return 'Lowercase, hyphens, starts with letter';
    },
  });
  if (p.isCancel(projectName)) return process.exit(0);

  const metaVars = await collectVars(template.variables || {});
  const featureVars = await collectPrompts(template.prompts || []);

  const compatLayers = getCompatibleLayers(templateId);
  let selectedLayers = [];
  let layerVars = {};

  if (compatLayers.length > 0) {
    const picked = await p.multiselect({
      message: 'Add-ons',
      options: compatLayers.map(l => ({ value: l.id, label: l.displayName })),
      required: false,
    });
    if (p.isCancel(picked)) return process.exit(0);

    selectedLayers = compatLayers.filter(l => picked.includes(l.id));
    for (const layer of selectedLayers) {
      const lv = await collectVars(layer.variables || {});
      layerVars = { ...layerVars, ...lv };
    }
  }

  p.outro('Generating project...');

  const vars = { projectName, ...metaVars, ...featureVars, ...layerVars };
  vars.className = toPascalCase(projectName);
  vars.runtime = template.runtime || 'node';

  if (template.runtime === 'java' && vars.groupId) {
    const artName = projectName.replace(/-/g, '');
    vars.artifactName = artName;
    vars.packageName = `${vars.groupId}.${artName}`;
    vars.packagePath = vars.packageName.replace(/\./g, '/');
  }

  return {
    templateId,
    projectName,
    variables: vars,
    layers: selectedLayers.map(l => l.id),
    options,
  };
}

// Collects values from an object-shaped variable config (template.variables, layer.variables)
async function collectVars(varDefs) {
  const result = {};
  for (const [key, cfg] of Object.entries(varDefs)) {
    if (cfg.source === 'global' || cfg.source === 'template') continue;

    const isSelect = cfg.type === 'select' || cfg.type === 'choice';
    let val;

    if (isSelect) {
      const opts = (cfg.choices || cfg.options || []).map(c => ({ value: c, label: c }));
      val = await p.select({ message: cfg.prompt, options: opts });
    } else {
      val = await p.text({
        message: cfg.prompt,
        placeholder: cfg.placeholder || '',
        initialValue: cfg.default || '',
      });
    }

    if (p.isCancel(val)) process.exit(0);
    result[key] = val;
  }
  return result;
}

// Collects values from an array-shaped prompt config (template.prompts)
async function collectPrompts(prompts) {
  const result = {};
  for (const pr of prompts) {
    let val;
    if (pr.type === 'select') {
      val = await p.select({
        message: pr.message,
        options: pr.choices.map(c => ({ value: c, label: c })),
      });
    } else {
      val = await p.text({
        message: pr.message,
        placeholder: pr.placeholder || '',
        initialValue: pr.default || '',
      });
    }
    if (p.isCancel(val)) process.exit(0);
    result[pr.name] = val;
  }
  return result;
}

function toPascalCase(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}
