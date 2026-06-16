import { isDatabaseEnabled } from "./db.js";
import * as fileStore from "./fileStore.js";
import * as postgresStore from "./postgresStore.js";

const store = isDatabaseEnabled() ? postgresStore : fileStore;

export const { listEntries, getEntryById, createEntry, updateEntry, deleteEntry, bootstrapUserEntries } = store;
