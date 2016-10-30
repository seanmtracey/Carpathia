const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;

let win;

function createWindow () {

	win = new BrowserWindow({
		width: 480,
		height: 360
	});

	win.loadURL(`file://${__dirname}/index.html`);

	// win.webContents.openDevTools();

	win.on('closed', () => {
		win = null
	});

	var template = [{
		label: "Application",
		submenu: [
			{ label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
		]}, {
		label: "Edit",
		submenu: [
			{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
			{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
			{ type: "separator" },
			{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
			{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
			{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
			{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
		]}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));

}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {

	if (process.platform !== 'darwin') {
		app.quit()
	}

});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
});
