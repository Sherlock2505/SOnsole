/* All the dependencies used in the project */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';


//global variables to be used

var DomParser = require('dom-parser');
var parser = new DomParser();
const panel =  vscode.window.createWebviewPanel('sonsoleView', 'Answers', vscode.ViewColumn.Two, {
	enableScripts: true
});
const tagName = ["Discrepancy", "Error", "Implementation", "Learning", "Conceptual", "MWE"];
const query_url="https://sleepy-taiga-14192.herokuapp.com/db/?Body=";
let folderPath = "";
let terminalData = {};

/* getting the workspace folder path in which the files are to be run */

if (vscode.workspace.workspaceFolders) {
	folderPath = vscode.workspace.workspaceFolders[0].uri
		.toString()
		.split(":")[1];
}

/* initially creating the boilerplate files for storing the terminal output */

fs.writeFile(path.join( < string > folderPath, "output.txt"), "", err => {
	if (err) {
		return vscode.window.showErrorMessage(
			"Failed to create boilerplate file!"
		);
	}
	vscode.window.showInformationMessage("Created boilerplate files");
});

/* The below function activates after pressing the command from command pallette */

export function activate(context: vscode.ExtensionContext) {

	let options = vscode.workspace.getConfiguration('terminalCapture');
	terminalData = {};

	/* Checking whether terminal capture is enabled or not */
	if (options.get('enable') === false) {
		console.log('Terminal Capture is disabled');
		return;
	}

	/* prints active message when extension is activated */
	console.log('sonsole extension is now active');

	if (options.get('useClipboard') === false) {
		vscode.window.terminals.forEach(t => {
			registerTerminalForCapture(t);
		});

		vscode.window.onDidOpenTerminal(t => {
			registerTerminalForCapture(t);
		});
	}

	/* registering the command named terminial capture to get the results on web view */
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

/* deactivate function runs when the active vscode window is closed */
export function deactivate() {
	console.log(terminalData);
	terminalData = {};
}

/* The below function captures the terminal output and processes it and send to next function for rendering results */
async function runClipboardMode(context:vscode.ExtensionContext) {

	/* the following list of commands caopy the oputput from terminal to clipboard and paste it to output.txt and save it */
	await vscode.commands.executeCommand('workbench.action.terminal.selectAll');
	await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
	let url = vscode.Uri.parse('file:' + folderPath + "/output.txt");
	await vscode.commands.executeCommand('vscode.open', url);
	await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
	await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	await vscode.commands.executeCommand('workbench.action.terminal.clear');

	/* Opens the output logs and processes it to get the error list */
	let text="";
	vscode.workspace.openTextDocument(folderPath + "/output.txt").then(async (document) => {
		text = document.getText();
		let errList:string[];		
		errList = text.split('\n');
		errList = errList.filter((err) => { return err.length > 0; });
		errList.shift();
		errList.pop();
		errList = errList.filter((err) => { return err.toLowerCase().includes("error:"); });
		
		// Get path to resource on disk
		const onDiskPathCSS = vscode.Uri.file( 
			path.join(context.extensionPath, 'src', 'styles.css')
		);
		const onDiskPathJS = vscode.Uri.file( 
			path.join(context.extensionPath, 'src', 'index.js')
		);

		// And get the special URI to use with the webview
		const cssURI = panel.webview.asWebviewUri(onDiskPathCSS);
		const jsURI = panel.webview.asWebviewUri(onDiskPathJS);

		/* panel generates webview from the error list fetched */
		panel.webview.html = await getWebviewContent(errList, cssURI, jsURI);
	});
}

/* sorting the results based on the probabilities for tags generated */
function argsort(test: any) {
	let result = [];
	for(let i = 0; i !== test.length; ++i) result[i] = i;
	result = result.sort(function(u,v) { return test[u] - test[v]; });
	return result.reverse();
}

/* Generation of webview from error list */
async function getWebviewContent(errList:string[],cssuri:any, jsuri: any) {

	/* default response when server gives timeout */
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
	let body: any;
	if(errList.length>=1){
		body = processError(errList[errList.length-1]);
	}else{
		body = "";
	} 
	
	/* requesting the api stack exchange for relevant results for the error */
	const URI = encodeURI(`https://api.stackexchange.com//2.2/search/advanced?order=desc&sort=activity&body=${body}&site=stackoverflow`);
	response = await axios.get(URI);
	
	/* The response results are filtered if they are answered and loaded in items list */
	let items = response.data.items;
	items = items.filter((item:any) => { return item.is_answered===true; });

	let tags = [];
	let proba = [];
	
	/* getting the response and generating the tags for questions based on the context */

	for(let i=0;i<Math.min(5,items.length);i+=1){

		let query_str="";
		response = await axios.get(items[i].link);
		var dom = parser.parseFromString(response.data);
		let tp = dom.getElementsByClassName("s-prose js-post-body")[0].getElementsByTagName("p");
		
		for(let j=0;j<tp.length;j+=1){
			query_str+=tp[j].textContent;
			query_str+=" ";
		}

		let tag = await axios.get(query_url+encodeURIComponent(query_str).substr(0,4000));
		console.log(tag);

		let sortedTag = argsort(tag.data);
		tags.push(sortedTag);
		proba.push(tag.data);
	}

	/* developing HTML response view for tagged responses in the list view form */

	var pre = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
		<link rel='stylesheet' href='`+ cssuri + `' />
		<title>SOnsole</title>
	</head>	
	<body>
		<h1>Results from stack overflow will be shown here</h1>
		<ul class="list-group">
			<table>
				<tr>
					<td><button class="post-tag custom-tag0" onclick="sort_by_tag('Conceptual')">Conceptual</button></td>
					<td><button class="post-tag custom-tag1" onclick="sort_by_tag('MWE')">MWE</button></td>
					<td><button class="post-tag custom-tag2" onclick="sort_by_tag('Discrepancy')">Discrepancy</button></td>
					<td><button class="post-tag custom-tag3" onclick="sort_by_tag('Error')">Error</button></td>
					<td><button class="post-tag custom-tag4" onclick="sort_by_tag('Implementation')">Implementation</button></td>
					<td><button class="post-tag custom-tag5" onclick="sort_by_tag('Learning')">Learning</button></td>			
				</tr>
			</table>
		</ul>`;

	
	var list = `<ul class="list-group">`;
	for(let i = 0; i <Math.min(5,items.length); i+=1){
		var listItem = `<li class="list-group-item">
		<p><a href=${items[i].link}>${items[i].title}</a></p>
		<p><ul>
		`;
		for(let j =0; j< items[i].tags.length; j++){
			listItem += `<li>${items[i].tags[j]}</li>`;
		}
		listItem+=`<table>
			
		<tr>
			<td><p style="font-size: 14px;" ><a class="post-tag inactiveLink custom-tag1 id="${tagName[tags[i][0]]}" value="${proba[i][tags[i][0]]}"">${tagName[tags[i][0]]}</a></p></td>
			<td><p style="font-size: 14px;" ><a class="post-tag inactiveLink custom-tag2 id="${tagName[tags[i][1]]}" value="${proba[i][tags[i][1]]}"">${tagName[tags[i][1]]}</a></p></td>
			<td><p style="font-size: 14px;" ><a class="post-tag inactiveLink custom-tag5 id="${tagName[tags[i][2]]}" value="${proba[i][tags[i][2]]}"">${tagName[tags[i][2]]}</a></p></td>
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
	list += `</ul>`;

	var post = `<script>
	function sort_by_tag(tag_name){
		var list = document.getElementsByClassName("list-group");
		switching = true;
		while (switching) {
			switching = false;
			b = list[1].getElementsByClassName("list-group-item");
			for (i = 0; i < (b.length - 1); i++) {
				shouldSwitch = false;
				let anchs1 = b[i].querySelectorAll('a');
				let anchs2 = b[i+1].querySelectorAll('a');
				
				let val1 = 0, val2 = 0;
				for(let i = 0; i < anchs1.length; i+=1){
					if(anchs1[i].innerText === tag_name) val1 = anchs1[i].attributes["value"].nodeValue;
					if(anchs2[i].innerText === tag_name) val2 = anchs2[i].attributes["value"].nodeValue;
				}
				
				if (val1 < val2) {
					shouldSwitch = true;
					break;
				}
			}
			if (shouldSwitch) {
				b[i].parentNode.insertBefore(b[i + 1], b[i]);
				switching = true;
			}
		}
	}
	</script></body></html>`;

	var doc = pre + list + post;
	return doc;
}

/* deletes contents of the ouput logs stored in output.txt */
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

/* registers the active terminal for capture */
function registerTerminalForCapture(terminal: vscode.Terminal) {
	terminal.processId.then(terminalId => {

		if (terminalId !== undefined) {

			( < any > terminalData)[terminalId] = "";
			( < any > terminal).onDidWriteData((data: any) => {
				( < any > terminalData)[terminalId] += data;
			});
		}
	});
}

/* processes the error based on languages the error is in */
function processError(err: string){
	if(err.split(' ')[0].toLocaleLowerCase().includes('cpp')){
		return 'error: ' + err.split('error: ').slice(1)[0];
	}
	if(err.split(' ')[0].toLocaleLowerCase().includes('java')){
		return 'java error: ' + err.split('error: ').slice(1)[0];
	}
	else{
		return err;
	}
}