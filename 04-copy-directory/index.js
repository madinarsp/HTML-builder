const fsPromisesModule = require("fs/promises");
const path = require("path");

const pathToOrigFolder = path.join(__dirname, "files");
const pathToCopiedFolder = path.join(__dirname, "files-copy");

async function copyFolderContent() {
  await fsPromisesModule.mkdir(pathToCopiedFolder, { recursive: true });

  const folderContent = await fsPromisesModule.readdir(pathToOrigFolder, {
    withFileTypes: true,
  });

  const arrayOfFileNames = [];

  for (const contentItem of folderContent) {
    const fileName = contentItem.name;

    const pathToOrigFile = path.join(pathToOrigFolder, fileName);
    const pathToCopiedFile = path.join(pathToCopiedFolder, fileName);
    fsPromisesModule.copyFile(pathToOrigFile, pathToCopiedFile);

    arrayOfFileNames.push(fileName);
  }

  const copiedFolderContent = await fsPromisesModule.readdir(
    pathToCopiedFolder,
    {
      withFileTypes: true,
    }
  );

  for (const contentItem of copiedFolderContent) {
    const fileName = contentItem.name;
    const pathToFile = path.join(pathToCopiedFolder, fileName);
    if (!arrayOfFileNames.includes(fileName)) {
      fsPromisesModule.rm(pathToFile);
    }
  }
}

copyFolderContent();
