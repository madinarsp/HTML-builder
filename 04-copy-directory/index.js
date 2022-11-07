const fsPromisesModule = require("fs/promises");
const path = require("path");

const pathToOrigFolder = path.join(__dirname, "files");
const pathToCopiedFolder = path.join(__dirname, "files-copy");

async function copyDir(origFolder, finalFolder) {
  await fsPromisesModule.mkdir(finalFolder, { recursive: true });

  const folderContent = await fsPromisesModule.readdir(origFolder, {
    withFileTypes: true,
  });

  const arrayOfFileNames = [];

  for (const contentItem of folderContent) {
    if (contentItem.isFile()) {
      const fileName = contentItem.name;

      const pathToOrigFile = path.join(origFolder, fileName);
      const pathToCopiedFile = path.join(finalFolder, fileName);
      fsPromisesModule.copyFile(pathToOrigFile, pathToCopiedFile);

      arrayOfFileNames.push(fileName);
    } else if (contentItem.isDirectory()) {
      const folderName = contentItem.name;
      const pathToOrigFolder = path.join(origFolder, folderName);
      const pathToCopiedFolder = path.join(finalFolder, folderName);
      copyDir(pathToOrigFolder, pathToCopiedFolder);
    }
  }

  const copiedFolderContent = await fsPromisesModule.readdir(finalFolder, {
    withFileTypes: true,
  });

  for (const contentItem of copiedFolderContent) {
    if (contentItem.isFile()) {
      const fileName = contentItem.name;
      const pathToFile = path.join(finalFolder, fileName);
      if (!arrayOfFileNames.includes(fileName)) {
        fsPromisesModule.rm(pathToFile);
      }
    }
  }
}

copyDir(pathToOrigFolder, pathToCopiedFolder);

