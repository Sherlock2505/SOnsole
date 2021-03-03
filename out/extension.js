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
                vscode.commands.executeCommand('vscode.open', url).then(() => __awaiter(this, void 0, void 0, function* () {
                    yield vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                    yield vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    // 	vscode.workspace.openTextDocument(folderPath + "/output.txt").then((document) => {
                    // 		let text = document.getText();
                    // 		console.log(text);
                    // 	});
                }));
            });
        });
        fs.unlink(folderPath + "/output.txt", function (err) {
            console.log('File deleted!');
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