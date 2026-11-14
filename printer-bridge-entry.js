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
