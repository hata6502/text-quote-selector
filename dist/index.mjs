import leven from "leven";
const contextLength = 32;
export const getTextIndex = (root) => {
    const index = [];
    let text = "";
    const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = nodeIterator.nextNode())) {
        if (!(node instanceof Text)) {
            throw new Error("node is not Text");
        }
        index.push([text.length, node]);
        text += node.textContent ?? "";
    }
    return { text, index };
};
export const getTextRange = (range) => {
    const startNode = getRangePointNode({
        container: range.startContainer,
        offset: range.startOffset,
    });
    const endNode = getRangePointNode({
        container: range.endContainer,
        offset: range.endOffset,
    });
    const textNodes = [];
    const nodeIterator = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_ALL);
    let node;
    let isInRange = false;
    while ((node = nodeIterator.nextNode())) {
        if (node === startNode) {
            isInRange = true;
        }
        if (isInRange && node instanceof Text) {
            textNodes.push(node);
        }
        if (node === endNode) {
            break;
        }
    }
    let startContainer;
    let startOffset = range.startOffset;
    startContainer = range.startContainer;
    if (!(startContainer instanceof Text)) {
        startContainer = textNodes.at(0);
        if (!startContainer) {
            throw new Error("startContainer not found");
        }
        startOffset = 0;
    }
    let endContainer;
    let endOffset = range.endOffset;
    endContainer = range.endContainer;
    if (!(endContainer instanceof Text)) {
        endContainer = textNodes.at(-1);
        if (!endContainer) {
            throw new Error("endContainer not found");
        }
        endOffset = (endContainer.textContent ?? "").length;
    }
    return {
        start: { textNode: startContainer, offset: startOffset },
        end: { textNode: endContainer, offset: endOffset },
    };
};
export const quoteText = (textIndex, range) => {
    const { start, end } = getTextRange(range);
    const startIndex = textRangePointToIndex(textIndex, start);
    const endIndex = textRangePointToIndex(textIndex, end);
    return {
        exact: textIndex.text.slice(startIndex, endIndex),
        prefix: textIndex.text.slice(Math.max(startIndex - contextLength, 0), startIndex),
        suffix: textIndex.text.slice(endIndex, endIndex + contextLength),
    };
};
export const textQuoteSelectorAll = (textIndex, { exact, prefix, suffix }) => {
    const exactMatchIndexes = [];
    let exactMatchIndex = -1;
    while ((exactMatchIndex = textIndex.text.indexOf(exact, exactMatchIndex + 1)) !==
        -1) {
        exactMatchIndexes.push(exactMatchIndex);
    }
    const matches = exactMatchIndexes.map((exactMatchIndex) => {
        const exactMatchEndIndex = exactMatchIndex + exact.length;
        const prefixDistance = typeof prefix === "string"
            ? leven(textIndex.text.slice(Math.max(exactMatchIndex - contextLength, 0), exactMatchIndex), prefix)
            : 0;
        const suffixDistance = typeof suffix === "string"
            ? leven(textIndex.text.slice(exactMatchEndIndex, exactMatchEndIndex + contextLength), suffix)
            : 0;
        const distance = prefixDistance + suffixDistance;
        return [exactMatchIndex, distance];
    });
    return [...matches]
        .sort(([, aDistance], [, bDistance]) => aDistance - bDistance)
        .map(([startIndex, distance]) => {
        const start = indexToTextRangePoint(textIndex, {
            index: startIndex,
            isStart: true,
        });
        const end = indexToTextRangePoint(textIndex, {
            index: startIndex + exact.length,
            isStart: false,
        });
        const range = new Range();
        range.setStart(start.textNode, start.offset);
        range.setEnd(end.textNode, end.offset);
        return { range, distance };
    });
};
const textRangePointToIndex = (textIndex, { textNode, offset }) => {
    const record = textIndex.index.find(([, currentTextNode]) => currentTextNode === textNode);
    if (!record) {
        throw new Error("textNode not found in index");
    }
    const [index] = record;
    return index + offset;
};
const indexToTextRangePoint = (textIndex, { index, isStart }) => {
    let prev;
    for (const current of textIndex.index) {
        const [currentIndex] = current;
        if (isStart ? index < currentIndex : index <= currentIndex) {
            break;
        }
        prev = current;
    }
    if (!prev) {
        throw new Error("index out of range");
    }
    const [prevIndex, textNode] = prev;
    return {
        textNode,
        offset: index - prevIndex,
    };
};
const getRangePointNode = ({ container, offset, }) => container instanceof Text ||
    container instanceof Comment ||
    container instanceof CDATASection
    ? container
    : [...container.childNodes].at(offset) ?? container.nextSibling;
