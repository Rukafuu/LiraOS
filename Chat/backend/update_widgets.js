import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatJsPath = path.join(__dirname, 'routes', 'chat.js');
const widgetInstructionsPath = path.join(__dirname, '.widget_instructions.txt');

// Read files
const chatJs = fs.readFileSync(chatJsPath, 'utf-8');
const newInstructions = fs.readFileSync(widgetInstructionsPath, 'utf-8');

// Find and replace the widget section
const startMarker = '=== CONVERSATIONAL UI WIDGETS (MEU NÉCTAR MODE) ===';
const endMarker = 'IMPORTANT: ALWAYS respond in the SAME LANGUAGE as the user. If the user speaks Portuguese, respond in Portuguese. Falantes de português devem ser respondidos em Português.';

const startIndex = chatJs.indexOf(startMarker);
const endIndex = chatJs.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find widget section markers');
  process.exit(1);
}

const before = chatJs.substring(0, startIndex);
const after = chatJs.substring(endIndex);

const updated = before + newInstructions + after;

// Write back
fs.writeFileSync(chatJsPath, updated, 'utf-8');

console.log('✅ Widget instructions updated successfully!');
console.log(`   Replaced ${endIndex - startIndex} characters with ${newInstructions.length} characters`);
