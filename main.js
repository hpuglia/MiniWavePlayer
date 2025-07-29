const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let openFilePath = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, argv) => {
      if (process.platform === 'win32') {
        const fileArg = argv.find(arg => arg.endsWith('.mp3') || arg.endsWith('.wav'));
        if (fileArg && mainWindow) {
          mainWindow.webContents.send('file-path', fileArg);
        }
      }
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');


    app.whenReady().then(() => {
        
      createWindow();

      if (process.platform === 'win32' && process.argv.length >= 2) {
        const fileArg = process.argv.find(arg => arg.endsWith('.mp3') || arg.endsWith('.wav'));
        if (fileArg) openFilePath = fileArg;
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 300,
    frame: false,
    resizable: false,
    fullscreenable: false,
    transparent: true,
    alwaysOnTop: false,
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  // Ativa comportamento magnético
  enableMagneticEdges(mainWindow, 50);

  // Carrega a interface
  mainWindow.loadFile('index.html');

  // Envia o caminho do arquivo de áudio, se houver
  mainWindow.webContents.once('did-finish-load', () => {
    if (openFilePath) {
      mainWindow.webContents.send('file-path', openFilePath);
      openFilePath = null;
    } else {
      dialog.showOpenDialog(mainWindow, {
        title: 'Selecione um arquivo de áudio',
        filters: [{ name: 'Áudio', extensions: ['mp3', 'wav'] }],
        properties: ['openFile']
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          mainWindow.webContents.send('file-path', result.filePaths[0]);
        }
      }).catch(err => {
        console.error('Erro ao abrir seletor de arquivos:', err);
      });
    }
  });
}

// Recebe sinal do botão de fechar
ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Snap magnético aprimorado
function enableMagneticEdges(win, threshold = 50) {
  const display = screen.getPrimaryDisplay();
  const screenBounds = display.workArea;

  let moveTimeout;

  win.on('moved', () => {
    if (moveTimeout) clearTimeout(moveTimeout);

    moveTimeout = setTimeout(() => {
      const winBounds = win.getBounds();

      let newX = winBounds.x;
      let newY = winBounds.y;

      const rightEdge = winBounds.x + winBounds.width;
      const bottomEdge = winBounds.y + winBounds.height;

      const screenRight = screenBounds.x + screenBounds.width;
      const screenBottom = screenBounds.y + screenBounds.height;

      // Snap left
      if (Math.abs(winBounds.x - screenBounds.x) < threshold) {
        newX = screenBounds.x;
      }
      // Snap right
      else if (Math.abs(rightEdge - screenRight) < threshold) {
        newX = screenRight - winBounds.width;
      } else {
        if (winBounds.x < screenBounds.x) newX = screenBounds.x;
        if (rightEdge > screenRight) newX = screenRight - winBounds.width;
      }

      // Snap top
      if (Math.abs(winBounds.y - screenBounds.y) < threshold) {
        newY = screenBounds.y;
      }
      // Snap bottom
      else if (Math.abs(bottomEdge - screenBottom) < threshold) {
        newY = screenBottom - winBounds.height;
      } else {
        if (winBounds.y < screenBounds.y) newY = screenBounds.y;
        if (bottomEdge > screenBottom) newY = screenBottom - winBounds.height;
      }

      if (newX !== winBounds.x || newY !== winBounds.y) {
        win.setBounds({ x: newX, y: newY, width: winBounds.width, height: winBounds.height });
      }
    }, 50);
  });
}
ipcMain.on('request-open-file', () => {
  if (!mainWindow) return;

  dialog.showOpenDialog(mainWindow, {
    title: 'Selecione um arquivo de áudio',
    filters: [{ name: 'Áudio', extensions: ['mp3', 'wav'] }],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow.webContents.send('file-path', result.filePaths[0]);
    }
  }).catch(err => {
    console.error('Erro ao abrir seletor de arquivos:', err);
  });
});
