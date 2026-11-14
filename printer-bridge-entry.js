import { Printer } from '@capgo/capacitor-printer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export { Printer };

export async function savePng(dataUrl, fileName = 'BATI-PILOT-Croquis.png') {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
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

export async function saveBase64File(data, fileName, mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  if (typeof data !== 'string' || !data.length) throw new Error('Invalid file data');
  const safeName = String(fileName || 'BATI-PILOT-Export.xlsx').replace(/[^\w.\-]/g, '_');
  await Filesystem.writeFile({
    path: safeName,
    data,
    directory: Directory.Cache,
    recursive: true,
  });
  const file = await Filesystem.getUri({ path: safeName, directory: Directory.Cache });
  await Share.share({
    title: 'BATI PILOT - Export Excel',
    text: 'Fichier Excel exporté depuis BATI PILOT',
    files: [file.uri],
    dialogTitle: 'Enregistrer ou partager le fichier Excel',
  });
}
