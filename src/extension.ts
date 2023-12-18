import * as vscode from 'vscode';
import { outputChannel, parseMarkdownHeaders } from './utils';
import {removeWikiLinkSymbolDispose, removeWikiLinkSymbolCmd, replaceLinkContentDispose, createReplaceLinkContentCmd } from './disposes';


export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(removeWikiLinkSymbolDispose);
    context.subscriptions.push(replaceLinkContentDispose);

    const mdDocSelector = [
        { language: 'markdown', scheme: 'file' },
        { language: 'markdown', scheme: 'untitled' },
    ];

    const path = require('path');
    const fs = require('fs');
    const linkProvider = vscode.languages.registerCompletionItemProvider(
        mdDocSelector,
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);

                if (!linePrefix.endsWith('[[')) {
                    return undefined;
                }

                const currentFilePath = document.uri.fsPath;

                const files = vscode.workspace.findFiles('**/*.md', null, 1000);
                return files.then((uris) => {
                    const items: vscode.CompletionItem[] = [];
                    uris.forEach((uri) => {
                        const fileName = path.basename(uri.fsPath, '.md');
                        const relativeFilePath = path.relative(path.dirname(currentFilePath), uri.fsPath);
                        const escapedPath = relativeFilePath.split(path.sep).join('/').replace(/ /g, '%20');
                        const item = new vscode.CompletionItem(fileName, vscode.CompletionItemKind.File);
                        item.insertText = new vscode.SnippetString(`[${fileName}](${escapedPath})`);
                        item.filterText = uri.fsPath;
                        item.detail = vscode.workspace.asRelativePath(uri);
                        item.command = removeWikiLinkSymbolCmd;
                        item.sortText = fileName.toLowerCase();
                        items.push(item);
                    });
                    return items;
                });
            }
        },
        '['
    );

    const headerProvider = vscode.languages.registerCompletionItemProvider(
        mdDocSelector,
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);
                if (!linePrefix.endsWith("[[#")) {
                    return undefined;
                }

                const headers = parseMarkdownHeaders(document.getText());
                outputChannel.appendLine("headers count is " + headers.length)
                return headers.map(header => {
                    let item = new vscode.CompletionItem(header, vscode.CompletionItemKind.Reference);
                    item.insertText = `[${header}](#${header.toLowerCase().replace(/ /g, '%20')})`;
                    item.command = removeWikiLinkSymbolCmd;
                    return item;
                });
            }
        },
        '#'
    );

    const mdFileHeaderProvider = vscode.languages.registerCompletionItemProvider(
        mdDocSelector,
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);
                if (!linePrefix.endsWith(".md#")) {
                    return undefined;
                }

                const mdLinkMatch = linePrefix.match(/\[(.*)\]\((.*\.md)#/);
                if (!mdLinkMatch) {
                    outputChannel.appendLine("linePrefix is " + linePrefix)
                    return undefined
                }

                const relativeFilePath = mdLinkMatch[2];
                const mdLink = mdLinkMatch[0];
                const absoluteFilePath = decodeURIComponent(path.join(path.dirname(document.uri.fsPath), relativeFilePath));

                // Check the file exists
                if (!fs.existsSync(absoluteFilePath)) {
                    outputChannel.appendLine("file not exists " + absoluteFilePath)
                    return undefined;
                }

                // Get the file content from absolute path
                let fileContent = fs.readFileSync(absoluteFilePath, 'utf-8');

                const headers = parseMarkdownHeaders(fileContent);
                outputChannel.appendLine("headers count is " + headers.length)
                return headers.map(header => {
                    let item = new vscode.CompletionItem(header, vscode.CompletionItemKind.Reference);
                    item.insertText = header.toLowerCase().replace(/ /g, '%20');
                    item.command = createReplaceLinkContentCmd(position, mdLink, header);

                    return item;
                });
            }
        },
        '#'
    );

    context.subscriptions.push(linkProvider, headerProvider, mdFileHeaderProvider);
}

// This method is called when your extension is deactivated
export function deactivate() { }



