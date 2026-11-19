
import { Printer } from '@capgo/capacitor-printer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

// Keep these native plugins available to the application entry point.
export { Printer, App };

/**
 * Replace characters that are not safe in a filename while preserving
 * ordinary letters, numbers, dots, underscores and hyphens.
 */
function makeSafeFileName(fileName, fallbackName) {
  const name = String(fileName || fallbackName)
    .trim()
    .replace(/[^\w.-]/g, '_');

  return name || fallbackName;
}

/**
 * Write a file to the app cache and open Android's share sheet.
 * The data argument must be a base64 data URL containing a PNG image.
 */
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
  if (!base64) {
    throw new Error('PNG image data is empty');
  }

  const safeName = makeSafeFileName(
    fileName,
    'BATI-PILOT-Croquis.png'
  );

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

  return { shared: true, fileName: safeName };
}

/**
 * Save a base64-encoded file (for example, an XLSX export) to the cache
 * and open Android's share sheet.
 */
export async function saveBase64File(
  data,
  fileName,
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
) {
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Invalid file data');
  }

  const safeName = makeSafeFileName(
    fileName,
    'BATI-PILOT-Export.xlsx'
  );

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
    text: `Fichier exporté depuis BATI PILOT (${mimeType})`,
    files: [file.uri],
    dialogTitle: 'Enregistrer ou partager le fichier',
  });

  return { shared: true, fileName: safeName };
}

/**
 * Export the complete BATI PILOT JSON database on Android.
 *
 * 1. Validate the JSON text before writing anything.
 * 2. Write it to the app cache.
 * 3. Open Android's share sheet so the user can save or share it.
 * 4. If opening the share sheet fails, try saving a persistent copy
 *    in the Documents directory.
 */
export async function saveJsonFile(
  jsonText,
  fileName = 'BATI_PILOT_all_projects.json'
) {
  if (typeof jsonText !== 'string' || jsonText.trim().length === 0) {
    throw new Error('Invalid JSON file data: the content is empty');
  }

  // Confirm that the supplied text is valid JSON before writing the file.
  try {
    JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `Invalid JSON content: ${error?.message || String(error)}`
    );
  }

  const safeName = makeSafeFileName(
    fileName,
    'BATI_PILOT_all_projects.json'
  );

  // First create a temporary file in the application cache.
  await Filesystem.writeFile({
    path: safeName,
    data: jsonText,
    directory: Directory.Cache,
    recursive: true,
    encoding: 'utf8',
  });

  const cachedFile = await Filesystem.getUri({
    path: safeName,
    directory: Directory.Cache,
  });

  // Share the cached JSON file through Android's native share chooser.
  try {
    await Share.share({
      title: 'BATI PILOT - Export JSON',
      text: 'Base de données exportée depuis BATI PILOT',
      files: [cachedFile.uri],
      dialogTitle: 'Enregistrer ou partager la base de données JSON',
    });

    return {
      shared: true,
      savedToDocuments: false,
      fileName: safeName,
      uri: cachedFile.uri,
    };
  } catch (shareError) {
    // If the share sheet cannot be opened, attempt a persistent save.
    try {
      const savedFile = await Filesystem.writeFile({
        path: safeName,
        data: jsonText,
        directory: Directory.Documents,
        recursive: true,
        encoding: 'utf8',
      });

      return {
        shared: false,
        savedToDocuments: true,
        fileName: safeName,
        uri: savedFile?.uri || null,
      };
    } catch (storageError) {
      throw new Error(
        `JSON share failed: ${shareError?.message || String(shareError)}; ` +
        `Documents save failed: ${storageError?.message || String(storageError)}`
      );
    }
  }
}
