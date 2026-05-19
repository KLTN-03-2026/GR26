import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

interface ModuleContractOptions {
  moduleName: string;
  expectedSubdirs?: string[];
  serviceFiles?: string[];
  typeFiles?: string[];
  allowDirectAxiosServiceFiles?: string[];
}

const projectRoot = process.cwd();

const readText = (relativePath: string) => {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
};

const assertRelativePathExists = (relativePath: string) => {
  assert.equal(
    fs.existsSync(path.join(projectRoot, relativePath)),
    true,
    `Thieu file hoac thu muc: ${relativePath}`
  );
};

export const assertModuleContract = ({
  moduleName,
  expectedSubdirs = [],
  serviceFiles = [],
  typeFiles = [],
  allowDirectAxiosServiceFiles = [],
}: ModuleContractOptions) => {
  const moduleRoot = `src/modules/${moduleName}`;

  assertRelativePathExists(moduleRoot);

  expectedSubdirs.forEach((subdir) => {
    assertRelativePathExists(`${moduleRoot}/${subdir}`);
  });

  typeFiles.forEach((typeFile) => {
    assertRelativePathExists(`${moduleRoot}/${typeFile}`);
    assert.match(
      readText(`${moduleRoot}/${typeFile}`),
      /export (interface|type|enum) /,
      `${moduleRoot}/${typeFile} phai export type/interface/enum`
    );
  });

  serviceFiles.forEach((serviceFile) => {
    const relativePath = `${moduleRoot}/${serviceFile}`;
    const content = readText(relativePath);
    const isDirectAxiosAllowed = allowDirectAxiosServiceFiles.includes(serviceFile);

    assertRelativePathExists(relativePath);
    assert.doesNotMatch(content, /https?:\/\/localhost/, `${relativePath} khong duoc hardcode localhost`);

    if (!isDirectAxiosAllowed) {
      assert.doesNotMatch(
        content,
        /import\s+axios\s+from\s+['"]axios['"]/,
        `${relativePath} phai dung axios instance chung`
      );
    }
  });
};

export const assertNoConsoleLog = (relativePath: string) => {
  assert.doesNotMatch(readText(relativePath), /console\.log\(/, `${relativePath} khong duoc con console.log debug`);
};
