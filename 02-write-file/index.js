const { stdin: input, stdout, exit } = process;
const readline = require("node:readline");
const fs = require("fs");
const path = require("path");

const pathToNewFile = path.join(__dirname, "output.txt");

const output = fs.createWriteStream(pathToNewFile);
const rl = readline.createInterface({ input, output });

console.log(
  "Please enter text line by line below to write to file 'output.txt'. Write 'exit' or press Ctrl+C to quit."
);

rl.on("line", (line) => {
  if (line === "exit") {
    endProcess();
  }
  output.write(line);
  output.write("\n");
});

process.on("SIGINT", () => {
  endProcess();
});

function endProcess() {
  console.log("\nBye! See what you typed in 'output.txt'");
  rl.close();
  exit();
}
