# SOnsole README

This extension is useful for getting solutions to error messages on the go while writing the code. Hence this is helpful for novice programmers. The Sonsole extension not only gives stackoverflow answered queries but also provides context based tags so that the semantic search is available and thus manual search time for answers reduces. 

## Features

> Using the terminal capture command we can see the results from stackoverflow with the tags.

![Answers displaying in webview using terminal capture command.](/images/out.gif)

> The results can be sorted on the basis of tags as shown below.

![Sorting the answers using the tags feature.](/images/out1.gif)

## Explanation of code and its flow 

* The code is divided into few functions for better code quality with the most optimal functionality
* The various functions involved are as follows:-
* * activate - Activates the extension and pushes the commands in the context of vscode window.
* * deactivate - Cleanup function after we close window and extension gets unactivated.
* * runClipboardMode - The clipboard mode function captures the output of terminal and processes it to generate error list. 
* * processError - The error query is processed for various languages. Currently Java, Cpp, and Python are only supported ones.
* * getWebViewContent
    * The firts part involves fetching answers for query using stackexchange api.
    * The second part tagging posts from filtered Stack Overflow posts.
* * argsort - helps to sort posts based on tags probabilities.
* * cleanCache - Cleans the content of output.txt file.
* * registerTerminalForCapture - registers terminal for capture.

## Explanation of working

![Diagram for explaining the architecture of project](/images/diagram.png)

## Extension Settings

This extension contributes the following settings:

* `terminalCapture.enable`: enable/disable this extension

## Known Issues

* The first issue is whenever error comes you have to manually press the terminal capture command from command palette.
* There can be automation to the process of collection of output from terminal whenever a file is run and it gives error.
* The output from terminal is stored in file rather we can try to fetch it directly from terminal and use it as a variable in code.

## Release Notes

### 1.0.0

Initial release of SOnsole

### 1.0.1

SOtagger used for tagging relevant results.

### 1.1.0

Sorting feature based on tags added.

## Contributors

[DEEP MAHESHWARI](https://github.com/Sherlock2505)      
[KIRTIK JANGALE](https://github.com/kirtikjangale)

