const Zip = require('adm-zip');
const { randomUUID } = require('crypto');
const fs = require('fs');

function createZip(outputFile, folder) {
    const zip = new Zip();
    zip.addLocalFolder(folder);
    zip.writeZip(outputFile);
}

/**
 * @param {string} content
 * @param {string} file
 */
function replace(file, content, replaceData) {
    replaceData['settings']['extensions'].forEach((value) => {
        if(!file.endsWith(value)) {
            return "%%USE_ORIGINAL_FILE%%";
        }
    });
    let result = content.toString("utf-8");
    for(data in replaceData['input']['all']) {
        result = result.replace("%%" + data + "%%", replaceData['input']['all'][data])
    }
    for(data in replaceData['input']) {
        if(data == "all") continue;
        if((data + "").startsWith("%%")) {
            if(file.endsWith((data + "").substring(2))) {
                for(data2 in replaceData['input'][data]) {
                    result = result.replace("%%" + data2 + "%%", replaceData['input'][data][data2])
                }
            }
        } else if((data + "").endsWith("%%")) {
            if(file.startsWith((data + "").substring(0, data.length - 2))) {
                for(data2 in replaceData['input'][data]) {
                    result = result.replace("%%" + data2 + "%%", replaceData['input'][data][data2])
                }
            }
        } else if(data == file) {
            for(data2 in replaceData['input'][data]) {
                result = result.replace("%%" + data2 + "%%", replaceData['input'][data][data2])
            }
        }
    }
    return result;
}

async function Zipper(inputDir, outputFile, replaceData) {
    let uuid = randomUUID();
    fs.readdir(inputDir, function(err, files) {
        if(err) {
            return console.log('Unable to scan directory: ' + err);
        }

        files.forEach(function(file) {
            let content = fs.readFileSync(inputDir + "/" + file);
            let result = replace(file, content, replaceData);
            if(!fs.existsSync("./temp-" + uuid + "/")) fs.mkdirSync("./temp-" + uuid + "/");
            if(result == "%%USE_ORIGINAL_FILE%%") {
                fs.copyFileSync(inputDir + "/" + file, "./temp-" + uuid + "/" + file);
            } else {
                fs.writeFileSync("./temp-" + uuid + "/" + file, result);
            }
        });
        createZip(outputFile, "./temp-" + uuid);
        fs.rmSync("./temp-" + uuid + "/", {recursive: true});
    });
}

Zipper.replace = replace;
Zipper.createZip = createZip;
module.exports = Zipper;
