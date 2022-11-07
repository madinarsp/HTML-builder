const fsPromisesModule = require("fs/promises");
const fs = require("fs");
const path = require("path");
const readline = require("node:readline");

const EventEmitter = require("events");
const emitter = new EventEmitter();

let copyComponentEventCount = 0;
let componentsCount = 0;
let copyStyleEventCount = 0;
const stylesArr = [];

const componentsData = {};

const pathToComponentsFolder = path.join(__dirname, "components");
const pathToTemplate = path.join(__dirname, "template.html");
const pathToDistFolder = path.join(__dirname, "project-dist");
const pathToFinalTemplate = path.join(pathToDistFolder, "index.html");
const pathToStylesFolder = path.join(__dirname, "styles");
const pathToFinalStyles = path.join(pathToDistFolder, "style.css");
const pathToFinalAssets = path.join(pathToDistFolder, "assets");
const pathToAssets = path.join(__dirname, "assets");

async function createProjectFolder() {
  await fsPromisesModule.mkdir(pathToDistFolder, { recursive: true });
}

function emptyFile(path) {
  fs.writeFile(path, "", (err) => {
    if (err) throw err;
  });
}

async function fillComponentsData() {
  const componentsFiles = await fsPromisesModule.readdir(
    pathToComponentsFolder,
    {
      withFileTypes: true,
    }
  );

  for (const componentItem of componentsFiles) {
    if (
      componentItem.isFile() &&
      path.extname(componentItem.name) === ".html"
    ) {
      componentsCount++;
      const componentName = componentItem.name.split(".")[0];
      const componentPath = path.join(
        pathToComponentsFolder,
        componentItem.name
      );
      componentsData[componentName] = "";
      const componentInput = fs.createReadStream(componentPath, "utf-8");
      componentInput.on("data", (chunk) => {
        componentsData[componentName] += chunk;
      });
      componentInput.on("end", () => {
        emitter.emit("copy-component");
      });
      componentInput.on("error", (error) =>
        console.log("Error", error.message)
      );
    }
  }
}

function fillFinalTemplate() {
  const templateInput = fs.createReadStream(pathToTemplate, "utf-8");

  const rl = readline.createInterface(templateInput);
  const regexp = /\{\{\w+?\}\}/gi;
  const finalTemplateOutput = fs.createWriteStream(pathToFinalTemplate);

  emptyFile(pathToFinalTemplate);

  rl.on("line", (line) => {
    let matchesArr;
    if ((matchesArr = line.match(regexp))) {
      for (matchItem of matchesArr) {
        const component = matchItem.slice(2, matchItem.length - 2);
        if (component in componentsData) {
          const componentRegexp = new RegExp(`\{\{${component}\}\}`, "gi");
          finalTemplateOutput.write(
            line
              .replace(componentRegexp, componentsData[component])
              .replace(regexp, "")
          );
          finalTemplateOutput.write("\n");
        }
      }
    } else {
      finalTemplateOutput.write(line);
      finalTemplateOutput.write("\n");
    }
  });
}

async function collectStyles() {
  const folderContent = await fsPromisesModule.readdir(pathToStylesFolder, {
    withFileTypes: true,
  });

  let index = 0;
  for (const contentItem of folderContent) {
    if (contentItem.isFile() && path.extname(contentItem.name) === ".css") {
      const fileIndex = index;
      stylesArr.length = Math.max(stylesArr.length, fileIndex + 1);
      index++;
      const pathToFile = path.join(pathToStylesFolder, contentItem.name);
      const input = fs.createReadStream(pathToFile, "utf-8");
      let fileStyles = [];
      input.on("data", (chunk) => {
        fileStyles.push(chunk);
      });
      input.on("end", () => {
        stylesArr[fileIndex] = fileStyles;
        emitter.emit("copy-styles");
      });
      input.on("error", (error) => console.log("Error", error.message));
    }
  }
}

function generateFinalStyles() {
  const output = fs.createWriteStream(pathToFinalStyles, { flags: "a" });

  emptyFile(pathToFinalStyles);

  for (const fileStyles of stylesArr) {
    for (const stylesPiece of fileStyles) {
      output.write(stylesPiece);
      output.write("\n");
    }
  }
}

async function copyFolder(origFolder, finalFolder) {
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
      copyFolder(pathToOrigFolder, pathToCopiedFolder);
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

createProjectFolder().then(() => {
  fillComponentsData();
  collectStyles();

  copyFolder(pathToAssets, pathToFinalAssets);

  emitter.on("copy-component", () => {
    copyComponentEventCount++;
    if (copyComponentEventCount === componentsCount) {
      fillFinalTemplate();
    }
  });

  emitter.on("copy-styles", () => {
    copyStyleEventCount++;
    if (copyStyleEventCount === stylesArr.length) {
      generateFinalStyles();
    }
  });
});
