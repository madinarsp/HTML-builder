const fsPromisesModule = require("fs/promises");
const fs = require("fs");
const path = require("path");

const pathToFolder = path.join(__dirname, "secret-folder");

async function readFilesInfo() {
  const folderContent = await fsPromisesModule.readdir(pathToFolder, {
    withFileTypes: true,
  });
  for (const contentItem of folderContent) {
    if (contentItem.isFile()) {
      const fileFullName = contentItem.name;
      const [fileName, fileExt] = fileFullName.split(".");
      const pathToFile = path.join(pathToFolder, fileFullName);
      fs.stat(pathToFile, (err, stats) => {
        const fileSizeKb = stats.size / 1000;
        console.log(`${fileName} - ${fileExt} - ${fileSizeKb}kb`);
      });
    }
  }
}

readFilesInfo();
