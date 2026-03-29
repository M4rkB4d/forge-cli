import { readFileSync } from 'fs';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const base = readFileSync('C:/Projects/forge-cli/templates/backend-springboot/base/pom.xml.ejs', 'utf-8');
const overlay = readFileSync('C:/Projects/forge-cli/layers/azure-sql/merge/pom.xml.ejs', 'utf-8');

// Simulate what EJS would produce
const renderedBase = base
  .replace(/<%= springBootVersion %>/g, '3.5.13')
  .replace(/<%= groupId %>/g, 'com.bank')
  .replace(/<%= projectName %>/g, 'test')
  .replace(/<%= javaVersion %>/g, '21')
  .replace(/<%= className %>/g, 'Test')
  .replace(/<%[\s\S]*?%>/g, ''); // strip remaining EJS

const renderedOverlay = overlay.replace(/<%[\s\S]*?%>/g, '');

const parserOpts = { ignoreAttributes: false, preserveOrder: true, commentPropName: '#comment' };
const parser = new XMLParser(parserOpts);

console.log('=== Parsing base ===');
const baseObj = parser.parse(renderedBase);
console.log(JSON.stringify(baseObj, null, 2).substring(0, 500));

console.log('\n=== Parsing overlay ===');
const overlayObj = parser.parse(renderedOverlay);
console.log(JSON.stringify(overlayObj, null, 2).substring(0, 500));
