import * as vscode from 'vscode';
// const fs = require("fs");
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
var DomParser = require('dom-parser');

let folderPath = "";
var parser = new DomParser();
const tagName = ["Discrepancy", "Error", "Implementation", "Learning", "Conceptual", "MWE"];

const query_url="https://sleepy-taiga-14192.herokuapp.com/db/?Body=";


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


		await runClipboardMode(context);
		await cleancache();

	}));
}

export function deactivate() {
	console.log(terminalData);
	terminalData = {};
}

async function runClipboardMode(context:vscode.ExtensionContext) {

	await vscode.commands.executeCommand('workbench.action.terminal.selectAll');

	await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
	await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');
	let url = vscode.Uri.parse('file:' + folderPath + "/output.txt");

	await vscode.commands.executeCommand('vscode.open', url);

	await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	await vscode.commands.executeCommand('workbench.action.terminal.clear');

	let text="";
	vscode.workspace.openTextDocument(folderPath + "/output.txt").then(async (document) => {
		text = document.getText();
		//console.log(text);
		let errList:string[];
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

		// Get path to resource on disk
		const onDiskPath = vscode.Uri.file( 
			path.join(context.extensionPath, 'src', 'styles.css')
		);
		// And get the special URI to use with the webview
		const cssURI = panel.webview.asWebviewUri(onDiskPath);

		panel.webview.html = await getWebviewContent(errList,cssURI);
		
	});
}

function argsort(test: any) {
	let result = [];
	for(let i = 0; i !== test.length; ++i) result[i] = i;
	result = result.sort(function(u,v) { return test[u] - test[v]; });
	return result.reverse();
}

function process(proba: any) {
	const proba_vals = proba;
	const order = argsort(proba);
	// display(proba_vals, order);
}

async function getWebviewContent(errList:string[],uri:any) {


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


	let response: any;
	response = await axios.get(`https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=activity&body=${errList[0]}&site=stackoverflow`);
	let items = response.data.items;
	items = items.filter((item:any) => {
	console.log(item.is_answered);
	return item.is_answered===true;});

	let tags = [];
	let proba = [];
	for(let i=0;i<items.length;i+=1){
		let str="";
		response = await axios.get(items[i].link);
		
		var dom = parser.parseFromString(response.data);

    	//console.log(dom.getElementsByClassName("s-prose js-post-body")[0].getElementsByTagName("p"));

		let tp = dom.getElementsByClassName("s-prose js-post-body")[0].getElementsByTagName("p");
		
		for(let j=0;j<tp.length;j+=1){
			str+=tp[j].textContent;
			str+=" ";
		}
		console.log(str);
		let tag = await axios.get(query_url+encodeURIComponent(str).substr(0,4000));
		console.log(tag);

		let sortedTag = argsort(tag.data);
		tags.push(sortedTag);
		proba.push(tag.data);
	}


	var pre = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
		<link rel='stylesheet' href='`+ uri + `' />
		<title>Cat Coding</title>
	</head>	
	<body>
		<h1>Results from stack overflow will be shown here</h1>`;
	var list = `<ul class="list-group">`;
	for(let i = 0; i < items.length; i+=1){
		var listItem = `<li class="list-group-item">
		<p><a href=${items[i].link}>${items[i].title}</a></p>
		<p><ul>
		`;
		for(let j =0; j< items[i].tags.length; j++){
			listItem += `<li>${items[i].tags[j]}</li>`;
		}
		listItem+=`<table>
			
		<tr>
			<td><p style="font-size: 14px;" ><a class="post-tag inactiveLink custom-tag1">${tagName[tags[i][0]]}</a></p></td>
			<td><p style="font-size: 14px;" ><a class="post-tag inactiveLink custom-tag2">${tagName[tags[i][1]]}</a></p></td>
			<td><p style="font-size: 14px;" ><a class="post-tag inactiveLink custom-tag5">${tagName[tags[i][2]]}</a></p></td>
		</tr>
		<tr>
			<td>
				<div class="progress"><div class="determinate" style="width: ${proba[i][tags[i][0]]*100}%"></div></div>
			</td>
			<td>
				<div class="progress"><div class="determinate" style="width: ${proba[i][tags[i][1]]*100}%"></div></div>
			</td>
			<td>
				<div class="progress"><div class="determinate" style="width: ${proba[i][tags[i][2]]*100}%"></div></div>
			</td>
		</tr>
		</table>`;
		listItem += "</ul></p>";
		list += listItem;
	}
	list += `<ul>`;
	var post = `</body></html>`;
	var doc = pre + list + post;
	console.log(items);
	return doc;
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
// 						});