const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let win;

function createWindow () {

	win = new BrowserWindow({
		width: 480,
		height: 360
	});

	win.loadURL(`file://${__dirname}/index.html`);

	win.webContents.openDevTools()

	win.on('closed', () => {
		win = null
	});
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
