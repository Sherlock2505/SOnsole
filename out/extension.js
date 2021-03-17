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
        const panel = vscode.window.createWebviewPanel('sonsoleView', 'Answers', vscode.ViewColumn.Two, { enableScripts: true });
        panel.webview.html = getWebviewContent();
    });
}
function getWebviewContent() {
    return `<!DOCTYPE html>
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
// 						  });
//# sourceMappingURL=extension.js.map