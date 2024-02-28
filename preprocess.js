const fs = require("fs")

module.exports = markdown => {
  return new Promise(resolve => {
    return resolve(includeFiles(markdown))
  })
}

const includeFiles = markdown =>
  markdown
    .split("\n")
    .map(line => {
      if (/^{{.*}}$/.test(line)) return readIncludeFile(line)
      return line
    })
    .join("\n")

const readIncludeFile = includeCommand => {
  let fileToRead = includeCommand.replace("{{", "").replace("}}", "")
  return fs.readFileSync(fileToRead, "utf8")
}
