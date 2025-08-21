import {JSONFilePreset} from 'lowdb/node'
import {WORK_DIR} from "./dir";

// Read or create db.json
const defaultData = {uploads: [], downloads: []}
const db = await JSONFilePreset(WORK_DIR + '/db.json', defaultData)

export default db