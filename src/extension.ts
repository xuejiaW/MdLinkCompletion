import * as vscode from 'vscode';
import { parseMarkdownHeaders, removeWikiLinkSymbolDispose, removeWikiLinkSymbolCmd } from './utils';

const outputChannel = vscode.window.createOutputChannel("Tasks");
outputChannel.show(); // Display the channel by default
outputChannel.appendLine('Congratulations, your extension mdlinkcompletion is now active!');

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(removeWikiLinkSymbolDispose);


    const mdDocSelector = [
        { language: 'markdown', scheme: 'file' },
        { language: 'markdown', scheme: 'untitled' },
    ];

    const path = require('path');
    const linkProvider = vscode.languages.registerCompletionItemProvider(
        mdDocSelector,
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);

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
                        item.command = removeWikiLinkSymbolCmd
                        items.push(item);
                    });
                    return items;
                });
            }
        },
        '['
    );

    const headerProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'markdown' },
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);
                if (!linePrefix.endsWith("[[#")) {
                    outputChannel.appendLine("direct return" + linePrefix)
                    return undefined;
                }

                // 解析文件并获取标题
                const headers = parseMarkdownHeaders(document.getText());
                outputChannel.appendLine("headers count is " + headers.length)
                // 创建补全项
                return headers.map(header => {
                    let item = new vscode.CompletionItem(header, vscode.CompletionItemKind.Reference);
                    item.insertText = `[${header}](#${header.toLowerCase().replace(/ /g, '%20')})`;
                    item.command = removeWikiLinkSymbolCmd
                    return item;
                });
            }
        },
        '#'
    );


    context.subscriptions.push(linkProvider, headerProvider);
}



// This method is called when your extension is deactivated
export function deactivate() { }



