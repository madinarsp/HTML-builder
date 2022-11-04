const fsPromisesModule = require("fs/promises");
const fs = require("fs");
const path = require("path");

const EventEmitter = require("events");
const emitter = new EventEmitter();

const pathToStylesFolder = path.join(__dirname, "styles");
const pathToSource = path.join(__dirname, "project-dist", "bundle.css");

let copyEventCount = 0;
const stylesArr = [];

emitter.on("copy-styles", () => {
  copyEventCount++;
  if (copyEventCount === stylesArr.length) {
    generateBundle();
  }
});

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

function generateBundle() {
  const output = fs.createWriteStream(pathToSource, { flags: "a" });

  for (const fileStyles of stylesArr) {
    for (const stylesPiece of fileStyles) {
      output.write(stylesPiece);
      output.write("\n");
    }
  }
}

fs.writeFile(pathToSource, "", (err) => {
  if (err) throw err;
});

collectStyles();
