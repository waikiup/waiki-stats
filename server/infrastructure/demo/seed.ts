/**
 * Les groupes réels de puces (BU Nantes, BU Rennes), utilisés pour peupler le mode démo.
 * En production, ils se créent depuis la page /admin (« Importer une liste »).
 */
export const SEED_GROUPS: Record<string, { client: string, uids: string[] }> = {
  'BU Nantes 1': { client: 'BU Nantes', uids: ['04:6C:6D:32:50:23:90', '04:93:6D:32:50:23:90', '04:52:6F:32:50:23:90', '04:62:6D:32:50:23:90', '04:BE:6E:32:50:23:90', '04:96:6B:32:50:23:90'] },
  'BU Nantes 2': { client: 'BU Nantes', uids: ['04:91:6A:32:50:23:90', '04:6E:75:32:50:23:90', '04:5E:75:32:50:23:90', '04:55:75:32:50:23:90', '04:57:6D:32:50:23:90', '04:AF:76:32:50:23:90'] },
  'BU Nantes 3': { client: 'BU Nantes', uids: ['04:5D:75:32:50:23:90', '04:B9:6E:32:50:23:90', '04:B8:73:32:50:23:90', '04:75:76:32:50:23:90', '04:86:6D:32:50:23:90', '04:BB:6E:32:50:23:90'] },
  'BU Nantes 4': { client: 'BU Nantes', uids: ['04:B7:75:32:50:23:90', '04:AF:75:32:50:23:90', '04:7C:6B:32:50:23:90', '04:7F:6F:32:50:23:90', '04:BF:72:32:50:23:90', '04:A3:67:32:50:23:90'] },
  'BU Rennes 1': { client: 'BU Rennes', uids: ['04:AB:71:32:50:23:90', '04:86:6B:32:50:23:90', '04:7D:76:32:50:23:90', '04:7F:A9:D2:14:22:90', '04:73:A8:D2:14:22:90', '04:92:69:32:50:23:90'] },
  'BU Rennes 2': { client: 'BU Rennes', uids: ['04:B7:6F:32:50:23:90', '04:59:68:32:50:23:90', '04:56:68:32:50:23:90', '04:80:6C:32:50:23:90', '04:61:66:32:50:23:90', '04:82:71:32:50:23:90'] },
  'BU Rennes 3': { client: 'BU Rennes', uids: ['04:B7:6A:32:50:23:90', '04:7C:70:32:50:23:90', '04:BB:6A:32:50:23:90', '04:6F:73:32:50:23:90', '04:4E:76:32:50:23:90', '04:65:6F:32:50:23:90'] }
}

/** Codes d'accès du mode démo uniquement */
export const DEMO_CLIENT_CODES: Record<string, string> = {
  'BU Nantes': 'DEMO-NANTES',
  'BU Rennes': 'DEMO-RENNES'
}
