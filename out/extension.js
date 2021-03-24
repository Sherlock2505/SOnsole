"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
// const fs = require("fs");
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
let folderPath = "";
if (vscode.workspace.workspaceFolders) {
    folderPath = vscode.workspace.workspaceFolders[0].uri
        .toString()
        .split(":")[1];
    console.log(folderPath);
}
const data = "hello world";
fs.writeFile(path.join(folderPath, "output.txt"), "", err => {
    if (err) {
        return vscode.window.showErrorMessage("Failed to create boilerplate file!");
    }
    vscode.window.showInformationMessage("Created boilerplate files");
});
// Common data to be used elsewhere
let terminalData = {};
function activate(context) {
    let options = vscode.workspace.getConfiguration('terminalCapture');
    terminalData = {};
    if (options.get('enable') === false) {
        console.log('Terminal Capture is disabled');
        return;
    }
    console.log('sonsole extension is now active');
    if (options.get('useClipboard') === false) {
        vscode.window.terminals.forEach(t => {
            registerTerminalForCapture(t);
        });
        vscode.window.onDidOpenTerminal(t => {
            registerTerminalForCapture(t);
        });
    }
    context.subscriptions.push(vscode.commands.registerCommand('extension.sonsole.runCapture', () => __awaiter(this, void 0, void 0, function* () {
        if (options.get('enable') === false) {
            console.log('Command has been disabled, not running');
        }
        const terminals = vscode.window.terminals;
        if (terminals.length <= 0) {
            vscode.window.showWarningMessage('No terminals found, cannot run copy');
            return;
        }
        yield runClipboardMode();
        yield cleancache();
    })));
}
exports.activate = activate;
function deactivate() {
    console.log(terminalData);
    terminalData = {};
}
exports.deactivate = deactivate;
function runClipboardMode() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.commands.executeCommand('workbench.action.terminal.selectAll');
        yield vscode.commands.executeCommand('workbench.action.terminal.copySelection');
        yield vscode.commands.executeCommand('workbench.action.terminal.clearSelection');
        let url = vscode.Uri.parse('file:' + folderPath + "/output.txt");
        yield vscode.commands.executeCommand('vscode.open', url);
        yield vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        yield vscode.commands.executeCommand('workbench.action.terminal.clear');
        let text = "";
        vscode.workspace.openTextDocument(folderPath + "/output.txt").then((document) => __awaiter(this, void 0, void 0, function* () {
            text = document.getText();
            //console.log(text);
            let errList;
            console.log(text);
            errList = text.split('\n');
            errList = errList.filter((err) => { return err.length > 0; });
            errList.shift();
            errList.pop();
            errList = errList.filter((err) => { return err.toLowerCase().includes("error"); });
            console.log(errList);
            const panel = vscode.window.createWebviewPanel('sonsoleView', 'Answers', vscode.ViewColumn.Two, {
                enableScripts: true
            });
            panel.webview.html = yield getWebviewContent(errList);
        }));
    });
}
function getWebviewContent(errList) {
    return __awaiter(this, void 0, void 0, function* () {
        let htmlResponse = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
	</head>	
	<body>
		<h1>Results from stack overflow will be shown here</h1>
		<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
		<h1 id="lines-of-code-counter">0</h1>
		<script>
			const counter = document.getElementById('lines-of-code-counter');

			let count = 0;
			setInterval(() => {
				counter.textContent = count++;
			}, 100);
		</script>
	</body>
	
	</html>`;
        let response;
        response = yield axios_1.default.get(`https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=activity&body=${errList[0]}&site=stackoverflow`);
        let data = response.data;
        var pre = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
		
		<title>Cat Coding</title>
	</head>	
	<body>
		<h1>Results from stack overflow will be shown here</h1>`;
        var list = `<ul class="list-group">`;
        for (let i = 0; i < data.items.length; i += 1) {
            var listItem = `<li class="list-group-item">
		<p><a href=${data.items[i].link}>${data.items[i].title}</a></p>
		<p><ul>
		`;
            for (let j = 0; j < data.items[i].tags.length; j++) {
                listItem += `<li>${data.items[i].tags[j]}</li>`;
            }
            listItem += "</ul></p>";
            list += listItem;
        }
        list += `<ul>`;
        var post = `</body></html>`;
        var doc = pre + list + post;
        console.log(data);
        return doc;
    });
}
function cleancache() {
    fs.writeFile(path.join(folderPath, "output.txt"), "", err => {
        if (err) {
            return vscode.window.showErrorMessage("Failed to create boilerplate file!");
        }
        vscode.window.showInformationMessage("Created boilerplate files");
    });
    vscode.commands.executeCommand('workbench.action.files.saveAll');
}
function deleteFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs.unlink(filePath, () => {
                console.log(`Deleted ${filePath}`);
            });
        }
        catch (error) {
            console.error(`Got an error trying to delete the file: ${error.message}`);
        }
    });
}
function registerTerminalForCapture(terminal) {
    terminal.processId.then(terminalId => {
        if (terminalId !== undefined) {
            terminalData[terminalId] = "";
            terminal.onDidWriteData((data) => {
                // TODO:
                //   - Need to remove (or handle) backspace
                //   - not sure what to do about carriage return???
                //   - might have some odd output
                terminalData[terminalId] += data;
            });
        }
    });
}
// const editor = vscode.window.activeTextEditor;
// 						if(editor!==undefined){
// 							var selection = editor.selection; 
// 							var text = editor.document.getText(selection);
// 							console.log(editor.document.getText());
// 						}
// 						vscode.workspace.openTextDocument('/home/kirtikjangale/Desktop/Project/sonsole/output.txt').then((document) => {
// 							let text = document.getText();
// 							console.log(text);
// 						});
//# sourceMappingURL=extension.js.map