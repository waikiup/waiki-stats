/**
 * Groupes de puces qui ne sont pas (ou pas sous le bon nom) dans authorized_tags.
 * Ils s'ajoutent aux groupes lus dans Appwrite ; si une puce est ici et là-bas, ce fichier l'emporte.
 * Rien n'est écrit dans Appwrite : pour changer un groupe, on modifie ce fichier.
 */
export const GROUPES_FIXES: { name: string, uids: string[] }[] = [
  {
    name: 'BU Nantes',
    uids: [
      '04:6C:6D:32:50:23:90', '04:93:6D:32:50:23:90', '04:52:6F:32:50:23:90', '04:62:6D:32:50:23:90', '04:BE:6E:32:50:23:90', '04:96:6B:32:50:23:90',
      '04:91:6A:32:50:23:90', '04:6E:75:32:50:23:90', '04:5E:75:32:50:23:90', '04:55:75:32:50:23:90', '04:57:6D:32:50:23:90', '04:AF:76:32:50:23:90',
      '04:5D:75:32:50:23:90', '04:B9:6E:32:50:23:90', '04:B8:73:32:50:23:90', '04:75:76:32:50:23:90', '04:86:6D:32:50:23:90', '04:BB:6E:32:50:23:90',
      '04:B7:75:32:50:23:90', '04:AF:75:32:50:23:90', '04:7C:6B:32:50:23:90', '04:7F:6F:32:50:23:90', '04:BF:72:32:50:23:90', '04:A3:67:32:50:23:90'
    ]
  },
  {
    name: 'BU Rennes',
    uids: [
      '04:AB:71:32:50:23:90', '04:86:6B:32:50:23:90', '04:7D:76:32:50:23:90', '04:7F:A9:D2:14:22:90', '04:73:A8:D2:14:22:90', '04:92:69:32:50:23:90',
      '04:B7:6F:32:50:23:90', '04:59:68:32:50:23:90', '04:56:68:32:50:23:90', '04:80:6C:32:50:23:90', '04:61:66:32:50:23:90', '04:82:71:32:50:23:90',
      '04:B7:6A:32:50:23:90', '04:7C:70:32:50:23:90', '04:BB:6A:32:50:23:90', '04:6F:73:32:50:23:90', '04:4E:76:32:50:23:90', '04:65:6F:32:50:23:90'
    ]
  }
]

/**
 * Groupe d'une puce de authorized_tags, d'après son nom :
 * toutes les variantes de « prévente » (PREVENT, PREVENTE, Prevente 3, PREVENTE`…) font « Prévente »,
 * et tout le reste (PLA, Waiki, LastWaiki, Offert 1, Sans nom…) fait « Autres ».
 */
export function nomDeGroupe(raw: string): string {
  const plat = raw.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return plat.startsWith('prevent') ? 'Prévente' : 'Autres'
}
