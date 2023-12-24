import * as vscode from 'vscode';
import {replaceMarkdownLinkContent as replaceMarkdownLinkContent , removeClosingBrackets} from './utils';


export let replaceLinkContentDispose = vscode.commands.registerTextEditorCommand('extension.replaceLinkContent', (editor, edit, ...additionalArguments) => {
    if (additionalArguments.length >= 3) {

        const [position, mdLink, header] = additionalArguments;

        replaceMarkdownLinkContent(editor, position, mdLink, header);
    }
});


export function createReplaceLinkContentCmd(position: vscode.Position, mdLink: string, header: string) {
    return {
        title: 'Replace Markdown Link Text',
        command: 'extension.replaceLinkContent',
        arguments: [position, mdLink, header]
    };
}

export let removeWikiLinkSymbolDispose = vscode.commands.registerTextEditorCommand('extension.removeWikiLinkSymbol', (editor, edit) => {
    const position = editor.selection.start;
    const line = editor.document.lineAt(position.line);
    const edits = removeClosingBrackets(position, line);
    edits.forEach((e) => {
        edit.delete(e.range);
    });
});

export let removeWikiLinkSymbolCmd = { command: 'extension.removeWikiLinkSymbol', title: 'Remove Wiki Link Symbol' };

