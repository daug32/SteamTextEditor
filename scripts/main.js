window.onload = () => {

const sourceAnchor = document.getElementById('source');
if (!sourceAnchor) throw new Error('No element found. Id: source');

const processedAnchor = document.getElementById('processed');
if (!processedAnchor) throw new Error('No element found. Id: processed');

const previouslySavedTextKey = 'previoustext';

const formatSteamText = buildTextFormatter();
const setFormattedText = text => {
    processedAnchor.innerHTML = !!text ? text : 'Preview of formatted Steam text will appear here...';
    sourceAnchor.style.minHeight = processedAnchor.clientHeight + 'px';
};

// Subscribe on input
sourceAnchor.addEventListener('input', () => {
    setFormattedText(formatSteamText(sourceAnchor.value));
    localStorage.setItem(previouslySavedTextKey, sourceAnchor.value);
});

// Subscribe on shortcuts
sourceAnchor.addEventListener('keydown', function ( event ) {
    if (event.altKey) {
        let command = null;

        if (event.key === '1') command = 'h1';
        else if (event.key === '2') command = 'h2';
        else if (event.key === '3') command = 'h3';
        else if (event.key === 'i') command = 'i';
        else if (event.key === 'u') command = 'u';
        else if (event.key === 'b') command = 'b';
        else if (event.key === 'l') command = 'link';
        else if (event.key === 'h') command = 'spoiler';

        if ( command === null ) {
            return;
        }

        if (setStyleToSelectedText(command)) {
            event.preventDefault();
        }
    }
});

// Subscribe on control buttons
document.getElementById('control-btn-h1').addEventListener('click', (event) => onControlButtonClick(event, 'h1'));
document.getElementById('control-btn-h2').addEventListener('click', (event) => onControlButtonClick(event, 'h2'));
document.getElementById('control-btn-h3').addEventListener('click', (event) => onControlButtonClick(event, 'h3'));
document.getElementById('control-btn-i').addEventListener('click', (event) => onControlButtonClick(event, 'i'));
document.getElementById('control-btn-u').addEventListener('click', (event) => onControlButtonClick(event, 'u'));
document.getElementById('control-btn-b').addEventListener('click', (event) => onControlButtonClick(event, 'b'));
document.getElementById('control-btn-strike').addEventListener('click', (event) => onControlButtonClick(event, 'strike'));
document.getElementById('control-btn-spoiler').addEventListener('click', (event) => onControlButtonClick(event, 'spoiler'));
document.getElementById('control-btn-link').addEventListener('click', (event) => onControlButtonClick(event, 'link'));
document.getElementById('control-btn-separator').addEventListener('click', (event) => onControlButtonClick(event, 'separator'));
document.getElementById('control-btn-list').addEventListener('click', (event) => onControlButtonClick(event, 'list'));

// Load previous content
const previousText = localStorage.getItem(previouslySavedTextKey);
sourceAnchor.value = previousText;
setFormattedText(formatSteamText(previousText));

function buildTextFormatter() {
    const formatters = [];

    // apply list formatters
    const listRegex = /\[list\](.*?)\[\/list\]( *\n)?/gs;
    const itemRegex = /\[\*\](.*?)(?=\[\*\]|$)/gs;

    formatters.push(text => text.replaceAll(listRegex, (match, content) => {
        const items = replaceAll(itemRegex, '<li>$1</li>')( content );
        return `<ul>${items}</ul>`;
    }));

    // apply default text mods styles
    formatters.push(replaceAll(/\[h([1-3])\](.+?)\[\/h\1\]( *\n)?/gs, '<div class="steam__header-$1">$2</div>'))
    formatters.push(replaceAll(/\[b\](.+?)\[\/b\]/gs, ' <b class="steam__bold">$1</b> '));
    formatters.push(replaceAll(/\[i\](.+?)\[\/i\]/gs, ' <i>$1</i> '));
    formatters.push(replaceAll(/\[u\](.+?)\[\/u\]/gs, ' <u>$1</u> '));
    formatters.push(replaceAll(/\[strike\](.+?)\[\/strike\]/gs, ' <span class="steam__strike">$1</span> '));
    formatters.push(replaceAll(/\[spoiler\](.+?)\[\/spoiler\]/gs, '<span class="steam__spoiler"><span>$1</span></span>'));

    // apply separator styles
    formatters.push(text => text.replaceAll(/\[hr\]\s*\[\/hr\]/g, '<hr class="steam__separator"/>'));
    formatters.push(text => text.replaceAll(/\[hr\](.+?)\[\/hr\]/gs, '<hr class="steam__separator"/>$1'));

    // apply general url tag
    formatters.push(text => text.replace(/\[url=([:\/?\-=.a-z0-9A-Z]+)\](.+?)\[\/url\]/gs, (match, url, text) => {
        let result = `<a class="steam__link" href="" target="_blank" rel="noopener">${text}</a>`;

        let domain = parseHost();
        if (domain.indexOf('steam') < 0) {
            result += ` <span class="steam__link-host">[${domain}]</span>`;
        }

        return result;

        function parseHost() {
            try {
                const parsedUrl = new URL(url);
                return parsedUrl.hostname;
            } catch (e) {
                try {
                    const parsedUrl = new URL(`http://${url}`);
                    return parsedUrl.hostname;
                } catch (e2) {
                    return url;
                }
            }
        }
    }));

    // apply parse links
    formatters.push(text => text.replaceAll(
        /(\w+:\/\/\S+)/g,
        `<a class="steam__link" href="" target="_blank" rel="noopener">$1</a>`));

    // apply html line breaks
    formatters.push(text => text.replaceAll('\n', '<br/>'));

    return text => !text ? '' : formatters.reduce((result, formatter) => formatter(result), text);
}

function replaceAll(regex, replaceBy) {
    return text => {
        let result = text;
        while(regex.test(result)) {
            result = result.replaceAll( regex, replaceBy );
        }
        return result;
    }
}

function onControlButtonClick(event, textFormattingCommand) {
    event.preventDefault();
    setStyleToSelectedText(textFormattingCommand);
    sourceAnchor.focus();
}

function setStyleToSelectedText(command) {
    const start = sourceAnchor.selectionStart;
    const end = sourceAnchor.selectionEnd;

    let selectedText = sourceAnchor.value.substring(start, end);
    if ( !selectedText ) {
        selectedText = '';
    }

    let replacementText = null;

    command = command.toLowerCase();

    let selectionStart = 0;
    let selectionEnd = 0;

    if (command === 'h1') {
        replacementText = `[h1]${selectedText.trim()}[/h1]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[h1]'.length;
    } else if (command === 'h2') {
        replacementText = `[h2]${selectedText.trim()}[/h2]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[h2]'.length;
    } else if (command === 'h3') {
        replacementText = `[h3]${selectedText.trim()}[/h3]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[h3]'.length;
    } else if (command === 'b') {
        replacementText = `[b]${selectedText}[/b]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[b]'.length;
    } else if (command === 'i') {
        replacementText = `[i]${selectedText}[/i]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[i]'.length;
    } else if (command === 'u') {
        replacementText = `[u]${selectedText}[/u]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[u]'.length;
    } else if (command === 'spoiler') {
        replacementText = `[spoiler]${selectedText}[/spoiler]`;
        selectionStart = selectionEnd = !!selectedText
            ? start + replacementText.length
            : start + '[spoiler]'.length;
    } else if (command === 'link') {
        replacementText = `[url=]${selectedText}[/url]`
        selectionEnd = selectionStart = start + '[url='.length;
    } else if (command === 'strike') {
        replacementText = `[strike]${selectedText}[/strike]`;
        selectionStart = selectionEnd = start + '[strike]'.length;
    } else if (command === 'separator') {
        if (!sourceAnchor.value) {
            replacementText = `[hr][/hr]\n`;
            selectionStart = selectionEnd = start + '[hr][/hr]\n'.length;
        } else {
            replacementText = `${selectedText}\n[hr][/hr]\n`;
            selectionStart = selectionEnd = start + '\n[hr][/hr]\n'.length;
        }
    } else if (command === 'list') {
        if (!sourceAnchor.value) {
            replacementText = `[list]\n[*]${selectedText}\n[/list]`;
            selectionStart = selectionEnd = start + `[list]\n[*]${selectedText}`.length;
        } else {
            replacementText = `\n[list]\n[*]${selectedText}\n[/list]`;
            selectionStart = selectionEnd = start + `\n[list]\n[*]${selectedText}`.length;
        }
    }

    if (!replacementText) {
        return false;
    }

    sourceAnchor.value =
        sourceAnchor.value.substring(0, start) +
        replacementText +
        sourceAnchor.value.substring(end);
    sourceAnchor.selectionStart = selectionStart;
    sourceAnchor.selectionEnd = selectionEnd;

    setFormattedText(formatSteamText(sourceAnchor.value));
    localStorage.setItem(previouslySavedTextKey, sourceAnchor.value);
}

};