import * as vscode from 'vscode';

export const outputChannel = vscode.window.createOutputChannel("Tasks");
outputChannel.show(); // Display the channel by default
outputChannel.appendLine('Congratulations, your extension mdlinkcompletion is now active!');


export function removeClosingBrackets(position: vscode.Position, line: vscode.TextLine) {
    const indexOfOpeningBrackets = line.text.lastIndexOf('[[', position.character);
    const indexOfClosingBrackets = line.text.indexOf(']]', position.character);

    let edits = [];

    if (indexOfOpeningBrackets !== -1) {
        let toDeleteCount = line.text[indexOfOpeningBrackets + 2] === '#' ? 3 : 2;
        const rangeToDeleteOpeningBrackets = new vscode.Range(
            line.range.start.with(undefined, indexOfOpeningBrackets),
            line.range.start.with(undefined, indexOfOpeningBrackets + toDeleteCount)
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

export let removeWikiLinkSymbolDispose = vscode.commands.registerTextEditorCommand('extension.removeWikiLinkSymbol', (editor, edit) => {
    const position = editor.selection.start;
    const line = editor.document.lineAt(position.line);
    const edits = removeClosingBrackets(position, line);
    edits.forEach((e) => {
        edit.delete(e.range);
    });
});

export function parseMarkdownHeaders(text: string) {
    // 用于匹配 Markdown 标题的正则表达式
    const headerRegex = /^(#+)\s+(.*)$/gm;
    let headers = [];
    let match;
    while ((match = headerRegex.exec(text)) !== null) {
        headers.push(match[2]);
    }
    return headers;
}

function replaceMarkdownLinkText(editor: vscode.TextEditor, mdLink: string, header: string) {
    editor.edit(editBuilder => {
        const matches = mdLink.match(/\[([^\]]+)\]/);

        if (matches && matches[1]) {
            const oldText = matches[1];
            const newText = `${header}`;

            const text = editor.document.getText();
            const startPos = text.indexOf(oldText);
            const endPos = startPos + oldText.length;

            if (startPos !== -1 && endPos !== -1) {
                const start = editor.document.positionAt(startPos);
                const end = editor.document.positionAt(endPos);
                const range = new vscode.Range(start, end);
                editBuilder.replace(range, newText);
            }
        }
    });
}

export let replaceLinkContentDispose = vscode.commands.registerTextEditorCommand('extension.replaceLinkContent', (editor, _, ...additionalArguments) => {
    if (additionalArguments.length >= 3) {

        const [_, __, mdLink, header] = additionalArguments;

        replaceMarkdownLinkText(editor, mdLink, header);
    }
});

export let removeWikiLinkSymbolCmd = { command: 'extension.removeWikiLinkSymbol', title: 'Remove Wiki Link Symbol' };

export function createReplaceLinkContentCmd(document: vscode.TextDocument, position: vscode.Position, mdLink: string, header: string) {
    return {
        title: 'Replace Markdown Link Text',
        command: 'extension.replaceLinkContent',
        arguments: [document, position, mdLink, header]
    };
}