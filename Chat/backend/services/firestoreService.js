import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FirestoreService {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        try {
            if (admin.apps.length) {
                this.db = admin.firestore();
                this.initialized = true;
                return;
            }

            // 1. Try FIREBASE_SERVICE_ACCOUNT_JSON (Best for Railway/Cloud Envs)
            if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
                try {
                    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                } catch (e) {
                    console.error('[FIRESTORE] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
                }
            }
            // 2. Try GOOGLE_APPLICATION_CREDENTIALS env var (Standard GCP)
            else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault()
                });
            } 
            // 3. Try Local JSON file
            else {
                const keyPath = path.join(__dirname, '../../serviceAccountKey.json'); // Root of project
                const keyPathData = path.join(__dirname, '../data/serviceAccountKey.json'); // Data dir

                if (fs.existsSync(keyPath)) {
                    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                } else if (fs.existsSync(keyPathData)) {
                    const serviceAccount = JSON.parse(fs.readFileSync(keyPathData, 'utf8'));
                    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                } else {
                    // 4. Fallback: Assumption of ADC (Application Default Credentials) usually for Cloud Run
                     console.warn('[FIRESTORE] No key found. Trying Application Default Credentials...');
                     admin.initializeApp();
                }
            }

            this.db = admin.firestore();
            this.db.settings({ ignoreUndefinedProperties: true });
            this.initialized = true;
            console.log('[FIRESTORE] Connected successfully. 🔥');

        } catch (error) {
            console.error('[FIRESTORE] Initialization Error:', error.message);
            this.initialized = false;
        }
    }

    // --- CRUD WRAPPERS ---

    async getCollection(collectionName) {
        if (!this.initialized) return [];
        try {
            const snapshot = await this.db.collection(collectionName).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error(`[FIRESTORE] getCollection(${collectionName}) error:`, e);
            return [];
        }
    }

    async getDoc(collectionName, docId) {
        if (!this.initialized) return null;
        try {
            const doc = await this.db.collection(collectionName).doc(docId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (e) {
            console.error(`[FIRESTORE] getDoc(${collectionName}, ${docId}) error:`, e);
            return null;
        }
    }
    
    // Find by specific field (e.g. find user by email)
    async findOne(collectionName, field, value) {
        if (!this.initialized) return null;
        try {
            const snapshot = await this.db.collection(collectionName)
                .where(field, '==', value)
                .limit(1)
                .get();
            
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (e) {
             console.error(`[FIRESTORE] findOne(${collectionName}, ${field}) error:`, e);
             return null;
        }
    }

    async setDoc(collectionName, docId, data, merge = true) {
        if (!this.initialized) return false;
        try {
            await this.db.collection(collectionName).doc(docId).set(data, { merge });
            return true;
        } catch (e) {
            console.error(`[FIRESTORE] setDoc(${collectionName}, ${docId}) error:`, e);
            return false;
        }
    }
    
    async addDoc(collectionName, data) {
         if (!this.initialized) return null;
         try {
             const res = await this.db.collection(collectionName).add(data);
             return res.id;
         } catch (e) {
             console.error(`[FIRESTORE] addDoc(${collectionName}) error:`, e);
             return null;
         }
    }

    async deleteDoc(collectionName, docId) {
        if (!this.initialized) return false;
        try {
            await this.db.collection(collectionName).doc(docId).delete();
            return true;
        } catch (e) {
             console.error(`[FIRESTORE] deleteDoc error:`, e);
             return false;
        }
    }
}

export const firestoreService = new FirestoreService();
export default firestoreService;
