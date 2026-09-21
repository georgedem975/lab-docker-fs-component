import { readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';

const ISU = '333414';

async function analyze(dirPath) {
  let files = 0;
  let directories = 0;
  let size = 0;

  for (const entry of await readdir(dirPath)) {
    const fullPath = join(dirPath, entry);
    const info = await lstat(fullPath);

    // Символические ссылки не учитываются
    if (info.isSymbolicLink()) {
      continue;
    }

    if (info.isFile()) {
      files += 1;
      size += info.size;
    } else if (info.isDirectory()) {
      // Сам корневой каталог /data не учитывается:
      // он не передаётся сюда как вложенный, поэтому каждый вызов
      // analyse() для подкаталога уже означает "вложенный каталог".
      directories += 1;
      const sub = await analyze(fullPath);
      files += sub.files;
      directories += sub.directories;
      size += sub.size;
    }
  }

  return { files, directories, size };
}

try {
  const result = await analyze('/data');
  process.stdout.write(`${ISU}-${result.files}-${result.directories}-${result.size}\n`);
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
}
