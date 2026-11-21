import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/vendor', {recursive:true});
for (const [src,dst] of [
  ['build/three.module.js','three.module.js'],
  ['build/three.core.js','three.core.js'],
  ['examples/jsm/controls/OrbitControls.js','OrbitControls.js'],
  ['LICENSE','THREE-LICENSE.txt']
]) await copyFile(`node_modules/three/${src}`,`dist/vendor/${dst}`);
console.log('Vendored Three.js and OrbitControls.');
