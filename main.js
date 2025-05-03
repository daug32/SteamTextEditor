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
    if (event.ctrlKey) {
        const isSuccess = setStyleToSelectedText(event.key);
        if (isSuccess) {
            event.preventDefault();
        }
    }
});

// Subscribe on control buttons
document.getElementById('control-btn-i')?.addEventListener('click', (event) => onControlButtonClick(event, 'i'));
document.getElementById('control-btn-u')?.addEventListener('click', (event) => onControlButtonClick(event, 'u'));
document.getElementById('control-btn-b')?.addEventListener('click', (event) => onControlButtonClick(event, 'b'));
document.getElementById('control-btn-strike')?.addEventListener('click', (event) => onControlButtonClick(event, 'strike'));
document.getElementById('control-btn-spoiler')?.addEventListener('click', (event) => onControlButtonClick(event, 'spoiler'));
document.getElementById('control-btn-link')?.addEventListener('click', (event) => onControlButtonClick(event, 'link'));
document.getElementById('control-btn-separator')?.addEventListener('click', (event) => onControlButtonClick(event, 'separator'));
document.getElementById('control-btn-list')?.addEventListener('click', (event) => onControlButtonClick(event, 'list'));

// Load previous content
const previousText = localStorage.getItem(previouslySavedTextKey);
sourceAnchor.value = previousText;
setFormattedText(formatSteamText(previousText));

function buildTextFormatter() {
    const formatters = [];

    // apply list formatters
    const listRegex = /\[list\](.*?)\[\/list\]/gs;
    const itemRegex = /^\s*\[\*\](.+)$/gs;

    formatters.push(text => text.replaceAll(listRegex, (match, content) => {
        const items = content
            .split('\n')
            .map(item => item.replaceAll(itemRegex, '<li>$1</li>'))
            .join('');
        return `<ul>${items}</ul>`;
    }));

    // apply default text mods styles
    formatters.push(text => text.replaceAll( /\[h([1-3])\](.+?)\[\/h\1\] */gs, '<div class="steam__header-$1">$2</div>'));
    formatters.push(text => text.replaceAll(/\[b\](.+?)\[\/b\]/gs, ' <b class="steam__bold">$1</b> '));
    formatters.push(text => text.replaceAll(/\[i\](.+?)\[\/i\]/gs, ' <i>$1</i> '));
    formatters.push(text => text.replaceAll(/\[u\](.+?)\[\/u\]/gs, ' <u>$1</u> '));
    formatters.push(text => text.replaceAll(/\[strike\](.+?)\[\/strike\]/gs, ' <span class="steam__strike">$1</span> '));
    formatters.push(text => text.replaceAll(/\[spoiler\](.+?)\[\/spoiler\]/gs, '<span class="steam__spoiler"><span>$1</span></span>'));

    // apply separator styles
    formatters.push(text => text.replaceAll( /\[hr\]\s*\[\/hr\]/g, '<hr class="steam__separator"/>'));
    formatters.push(text => text.replaceAll( /\[hr\](.+?)\[\/hr\]/gs, '<hr class="steam__separator"/>$1'));

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
    formatters.push(text => text.replaceAll( /(\S+:\/\/\S+)/g, `<a class="steam__link" href="" target="_blank" rel="noopener">$1</a>`));

    // apply html line breaks
    formatters.push(text => text.replaceAll('\n', '<br/>'));

    return text => !text ? '' : formatters.reduce((result, formatter) => formatter(result), text);
}

function onControlButtonClick(event, textFormattingCommand) {
    event.preventDefault();
    setStyleToSelectedText(textFormattingCommand);
}

function setStyleToSelectedText(command) {
    const start = sourceAnchor.selectionStart;
    const end = sourceAnchor.selectionEnd;
    if ( command !== 'separator' && start === end ) {
        return false;
    }
    const selectedText = sourceAnchor.value.substring(start, end);
    if ( command !== 'separator' && !selectedText ) {
        return false;
    }

    let replacementText = null;

    command = command.toLowerCase();
    if (command === 'b') {
        replacementText = `[b]${selectedText}[/b]`;
    } else if (command === 'i') {
        replacementText = `[i]${selectedText}[/i]`;
    } else if (command === 'u') {
        replacementText = `[u]${selectedText}[/u]`;
    } else if (command === 'h' || command === 'spoiler') {
        replacementText = `[spoiler]${selectedText}[/spoiler]`;
    } else if (command === 'l' || command === 'link' ) {
        replacementText = `[url=]${selectedText}[/url]`
    } else if (command === 'strike') {
        replacementText = `[strike]${selectedText}[/strike]`;
    } else if (command === 'separator') {
        replacementText = `${selectedText}[hr][/hr]`;
    } else if (command === 'list') {
        replacementText = `[list]\n[*]${selectedText}\n[/list]`;
    }

    if (!replacementText) {
        return false;
    }

    console.log( sourceAnchor.selectionStart );

    sourceAnchor.value = sourceAnchor.value.substring(0, start) + replacementText + sourceAnchor.value.substring(end);

    if (command === 'l') {
        sourceAnchor.selectionStart = start + '[url='.length;
        sourceAnchor.selectionEnd = sourceAnchor.selectionStart;
    }
    else if (command === 'separator') {
        sourceAnchor.selectionStart = sourceAnchor.selectionEnd;
        sourceAnchor.focus();
        console.log(sourceAnchor.selectionStart);
    }
    else {
        sourceAnchor.selectionStart = start;
        sourceAnchor.selectionEnd = start + replacementText.length;
    }

    setFormattedText(formatSteamText(sourceAnchor.value));
    localStorage.setItem(previouslySavedTextKey, sourceAnchor.value);
}

};