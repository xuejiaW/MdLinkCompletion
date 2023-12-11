// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel("Md Link Completion");
outputChannel.appendLine('Congratulations, your extension mdlinkcompletion is now active!');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


    let disposable = vscode.commands.registerTextEditorCommand('extension.removeBrackets', (editor, edit) => {
        const position = editor.selection.start;
        const line = editor.document.lineAt(position.line);
        const edits = removeClosingBrackets(position, line);
        edits.forEach((e) => {
            edit.delete(e.range);
        });
    });
    context.subscriptions.push(disposable);


    const mdDocSelector = [
        { language: 'markdown', scheme: 'file' },
        { language: 'markdown', scheme: 'untitled' },
    ];

    const path = require('path');
    const provider = vscode.languages.registerCompletionItemProvider(
        mdDocSelector,
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);
                outputChannel.appendLine('abc abc is ' + linePrefix)

                if (!linePrefix.endsWith('[[')) {
                    return undefined;
                }

                // Get the file system path of the current document
                const currentFilePath = document.uri.fsPath;

                const files = vscode.workspace.findFiles('**/*.md', null, 1000);
                return files.then((uris) => {
                    const items: vscode.CompletionItem[] = [];
                    uris.forEach((uri) => {
                        const fileName = path.basename(uri.fsPath, '.md');
                        // Calculate the relative path from the current file to the markdown file
                        const relativeFilePath = path.relative(path.dirname(currentFilePath), uri.fsPath);
                        // Replace backslashes with forward slashes and escape spaces
                        const escapedPath = relativeFilePath.split(path.sep).join('/').replace(/ /g, '%20');
                        const item = new vscode.CompletionItem(fileName, vscode.CompletionItemKind.File);
                        // Use the escaped path for the markdown link
                        item.insertText = new vscode.SnippetString(`[${fileName}](${escapedPath})`);
                        item.filterText = uri.fsPath;
                        item.detail = vscode.workspace.asRelativePath(uri);
                        item.command = { command: 'extension.removeBrackets', title: 'Remove Brackets' };
                        items.push(item);
                    });
                    return items;
                });
            }
        },
        '[' // triggered whenever a '[' is being typed
    );

    context.subscriptions.push(provider);
}


function removeClosingBrackets(position: vscode.Position, line: vscode.TextLine) {
    const indexOfOpeningBrackets = line.text.lastIndexOf('[[', position.character);
    const indexOfClosingBrackets = line.text.indexOf(']]', position.character);

    let edits = [];

    if (indexOfOpeningBrackets !== -1) {
        const rangeToDeleteOpeningBrackets = new vscode.Range(
            line.range.start.with(undefined, indexOfOpeningBrackets),
            line.range.start.with(undefined, indexOfOpeningBrackets + 2)
        );
        edits.push(vscode.TextEdit.delete(rangeToDeleteOpeningBrackets));
    }

    if (indexOfClosingBrackets !== -1) {
        const rangeToDeleteClosingBrackets = new vscode.Range(
            line.range.start.with(undefined, indexOfClosingBrackets),
            line.range.start.with(undefined, indexOfClosingBrackets + 2)
        );
        edits.push(vscode.TextEdit.delete(rangeToDeleteClosingBrackets));
    }

    return edits;
}

// This method is called when your extension is deactivated
export function deactivate() { }



