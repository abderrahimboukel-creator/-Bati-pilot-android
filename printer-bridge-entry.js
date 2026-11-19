
import { Printer } from '@capgo/capacitor-printer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

export { Printer, App };

export async function savePng(
  dataUrl,
  fileName = 'BATI-PILOT-Croquis.png'
) {
  if (
    typeof dataUrl !== 'string' ||
    !dataUrl.startsWith('data:image/png;base64,')
  ) {
    throw new Error('Invalid PNG data URL');
  }

  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const safeName = String(fileName).replace(/[^\w.\-]/g, '_');

  await Filesystem.writeFile({
    path: safeName,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  const file = await Filesystem.getUri({
    path: safeName,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'BATI PILOT - Croquis PNG',
    text: 'Croquis exporté depuis BATI PILOT',
    files: [file.uri],
    dialogTitle: 'Enregistrer ou partager le croquis',
  });
}

export async function saveBase64File(
  data,
  fileName,
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
) {
  if (typeof data !== 'string' || !data.length) {
    throw new Error('Invalid file data');
  }

  const safeName = String(
    fileName || 'BATI-PILOT-Export.xlsx'
  ).replace(/[^\w.\-]/g, '_');

  await Filesystem.writeFile({
    path: safeName,
    data,
    directory: Directory.Cache,
    recursive: true,
  });

  const file = await Filesystem.getUri({
    path: safeName,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'BATI PILOT - Export Excel',
    text: 'Fichier Excel exporté depuis BATI PILOT',
    files: [file.uri],
    dialogTitle: 'Enregistrer ou partager le fichier Excel',
  });
}

export async function saveJsonFile(
  jsonText,
  fileName = 'BATI_PILOT_all_projects.json'
) {
  if (typeof jsonText !== 'string' || !jsonText.length) {
    throw new Error('Invalid JSON file data');
  }

  // Validate before touching device storage.
  JSON.parse(jsonText);

  const safeName = String(fileName || 'BATI_PILOT_all_projects.json')
    .replace(/[^\\w.\\-]/g, '_');

  // Cache is reliable for sharing a temporary file with Android's chooser.
  await Filesystem.writeFile({
    path: safeName,
    data: jsonText,
    directory: Directory.Cache,
    recursive: true,
  });

  const cachedFile = await Filesystem.getUri({
    path: safeName,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: 'BATI PILOT - Export JSON',
      text: 'Base de données exportée depuis BATI PILOT',
      files: [cachedFile.uri],
      dialogTitle: 'Enregistrer ou partager la base de données JSON',
    });
    return { shared: true, savedToDocuments: false, fileName: safeName };
  } catch (shareError) {
    // If Android's share sheet is unavailable, keep a persistent copy
    // in Documents instead of losing the export.
    try {
      await Filesystem.writeFile({
        path: safeName,
        data: jsonText,
        directory: Directory.Documents,
        recursive: true,
      });
      return {
        shared: false,
        savedToDocuments: true,
        fileName: safeName,
      };
    } catch (storageError) {
      throw new Error(
        `JSON share failed: ${shareError?.message || shareError}; ` +
        `Documents save failed: ${storageError?.message || storageError}`
      );
    }
  }
}
