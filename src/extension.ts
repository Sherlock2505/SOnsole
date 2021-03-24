import * as vscode from 'vscode';
// const fs = require("fs");
import * as fs from 'fs';
import * as path from 'path';

let folderPath = "";

if (vscode.workspace.workspaceFolders) {
	folderPath = vscode.workspace.workspaceFolders[0].uri
		.toString()
		.split(":")[1];
	console.log(folderPath);
}

const data = "hello world";

fs.writeFile(path.join( < string > folderPath, "output.txt"), "", err => {
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

	context.subscriptions.push(vscode.commands.registerCommand('extension.sonsole.runCapture', async () => {
		if (options.get('enable') === false) {
			console.log('Command has been disabled, not running');
		}

		const terminals = < vscode.Terminal[] > ( < any > vscode.window).terminals;
		if (terminals.length <= 0) {
			vscode.window.showWarningMessage('No terminals found, cannot run copy');
			return;
		}


		await runClipboardMode();
		await cleancache();

	}));
}

export function deactivate() {
	console.log(terminalData);
	terminalData = {};
}

async function runClipboardMode() {

	await vscode.commands.executeCommand('workbench.action.terminal.selectAll');

	await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
	await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');
	let url = vscode.Uri.parse('file:' + folderPath + "/output.txt");

	await vscode.commands.executeCommand('vscode.open', url);

	await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	await vscode.commands.executeCommand('workbench.action.terminal.clear');

	vscode.workspace.openTextDocument(folderPath + "/output.txt").then((document) => {
		let text = document.getText();
		console.log(text);
	});

	const panel = vscode.window.createWebviewPanel('sonsoleView', 'Answers', vscode.ViewColumn.Two, {
		enableScripts: true
	});
	panel.webview.html = getWebviewContent();

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
	fs.writeFile(path.join( < string > folderPath, "output.txt"), "", err => {
		if (err) {
			return vscode.window.showErrorMessage(
				"Failed to create boilerplate file!"
			);
		}
		vscode.window.showInformationMessage("Created boilerplate files");
	});
	vscode.commands.executeCommand('workbench.action.files.saveAll');

}

async function deleteFile(filePath: fs.PathLike) {
	try {
		fs.unlink(filePath, () => {
			console.log(`Deleted ${filePath}`);
		});

	} catch (error) {
		console.error(`Got an error trying to delete the file: ${error.message}`);
	}
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