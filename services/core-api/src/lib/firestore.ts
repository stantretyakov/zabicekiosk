import { Firestore } from '@google-cloud/firestore';

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!db) {
    db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      databaseId: process.env.FIRESTORE_DATABASE_ID,
        ignoreUndefinedProperties: true,
    });
  }
  return db;
}
