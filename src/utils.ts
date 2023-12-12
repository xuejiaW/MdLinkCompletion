import * as vscode from 'vscode';

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

export let removeWikiLinkSymbolDispose = vscode.commands.registerTextEditorCommand('extension.removeWikiLinkSymbol', (editor, edit) => {
    const position = editor.selection.start;
    const line = editor.document.lineAt(position.line);
    const edits = removeClosingBrackets(position, line);
    edits.forEach((e) => {
        edit.delete(e.range);
    });
});

export let removeWikiLinkSymbolCmd = { command: 'extension.removeWikiLinkSymbol', title: 'Remove Wiki Link Symbol' };