#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
if (args.length !== 1) {
	console.error('Usage: bun scripts/bump-version.ts <new-version>');
	console.error('Example: bun scripts/bump-version.ts 0.2.0');
	process.exit(1);
}

const newVersion = args[0];
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
	console.error('Invalid version format. Use semver: X.Y.Z');
	process.exit(1);
}

const files = [
	{ path: 'package.json', pattern: /"version":\s*"[^"]+"/g, replacement: `"version": "${newVersion}"` },
	{ path: 'src/index.tsx', pattern: /CURRENT_VERSION = '[^']+'/g, replacement: `CURRENT_VERSION = '${newVersion}'` },
	{ path: 'worker/index.ts', pattern: /latestVersion: '[^']+'/g, replacement: `latestVersion: '${newVersion}'` },
];

for (const file of files) {
	const filePath = join(process.cwd(), file.path);
	try {
		const content = readFileSync(filePath, 'utf-8');
		const updated = content.replace(file.pattern, file.replacement);

		if (content === updated) {
			console.log(`⚠️  No changes in ${file.path}`);
		} else {
			writeFileSync(filePath, updated, 'utf-8');
			console.log(`✓ Updated ${file.path}`);
		}
	} catch (error) {
		console.error(`✗ Failed to update ${file.path}:`, error);
	}
}

console.log(`\n✓ Version bumped to ${newVersion}`);
console.log('\nNext steps:');
console.log('1. Update CHANGELOG.md');
console.log('2. Run: bun run build');
console.log('3. Run: git add -A && git commit -m "v' + newVersion + '"');
console.log('4. Run: git tag v' + newVersion);
console.log('5. Run: git push && git push --tags');
