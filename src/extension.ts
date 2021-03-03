import * as vscode from 'vscode';
// const fs = require("fs");
import * as fs from 'fs';
import * as path from 'path';

let folderPath;

if(vscode.workspace.workspaceFolders){
	folderPath = vscode.workspace.workspaceFolders[0].uri
  	.toString()
  	.split(":")[1];
	console.log(folderPath);
}

let url = vscode.Uri.parse('file:' + folderPath+ "/lexer/Makefile");
vscode.commands.executeCommand('vscode.open', url);

const data = "hello world";

fs.writeFile(path.join(<string>folderPath, "output.txt"), data, err => {
	if (err) {
	  return vscode.window.showErrorMessage(
		"Failed to create boilerplate file!"
	  );
	}
	vscode.window.showInformationMessage("Created boilerplate files");
});
// Common data to be used elsewhere

let terminalData = {};

export function activate(context: vscode.ExtensionContext) {
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

		const terminals = < vscode.Terminal[] > ( < any > vscode.window).terminals;
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



function runCapture() {
	vscode.commands.executeCommand('extension.sonsole.runCapture');
}

export function deactivate() {
	console.log(terminalData);
	terminalData = {};
}

function runClipboardMode() {
	vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
		vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
			vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
				vscode.commands.executeCommand('workbench.action.files.newUntitledFile').then(() => {
					
				  });

				vscode.workspace.openTextDocument('/home/kirtikjangale/Desktop/Project/sonsole/output.txt').then((document) => {
					
					
					document.save();
					
					
					//vscode.commands.executeCommand('workbench.action.files.close');
				});

				// vscode.commands.executeCommand('workbench.action.files.newUntitledFile').then(() => {
				// 	vscode.commands.executeCommand('editor.action.clipboardPasteAction').then(()=>{

				//	writeFileSync('/home/kirtikjangale/Desktop/Project/sonsole/output.txt','fsdfs');
					
				// 	});
				//   });
				// const file = readFileSync('foo.txt','utf8');
				// console.log(file);


			});
		});
	});
}

function registerTerminalForCapture(terminal: vscode.Terminal) {
	terminal.processId.then(terminalId => {

		if (terminalId !== undefined) {

			( < any > terminalData)[terminalId] = "";
			( < any > terminal).onDidWriteData((data: any) => {
				// TODO:
				//   - Need to remove (or handle) backspace
				//   - not sure what to do about carriage return???
				//   - might have some odd output
				( < any > terminalData)[terminalId] += data;
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