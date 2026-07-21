// Registers the Ripl panel inside the browser devtools. The panel page itself
// lives at src/panel/index.html and is declared as an extra rollup input.
chrome.devtools.panels.create('Ripl', 'icons/icon-active-32.png', 'src/panel/index.html');

export {};
