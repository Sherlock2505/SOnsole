"use strict";
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
fs.writeFile(path.join(folderPath, "output.txt"), data, err => {
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
    context.subscriptions.push(vscode.commands.registerCommand('extension.sonsole.runCapture', () => {
        if (options.get('enable') === false) {
            console.log('Command has been disabled, not running');
        }
        const terminals = vscode.window.terminals;
        if (terminals.length <= 0) {
            vscode.window.showWarningMessage('No terminals found, cannot run copy');
            return;
        }
        if (options.get('useClipboard') === true) {
            runClipboardMode();
        }
    }));
    // runCapture();
}
exports.activate = activate;
function deactivate() {
    console.log(terminalData);
    terminalData = {};
}
exports.deactivate = deactivate;
function runClipboardMode() {
    vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
        vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
                let url = vscode.Uri.parse('file:' + folderPath + "/output.txt");
                vscode.commands.executeCommand('vscode.open', url).then(() => {
                    vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                });
            });
        });
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