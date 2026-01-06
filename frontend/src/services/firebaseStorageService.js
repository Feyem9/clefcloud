import { storage, db } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Upload d'un fichier de partition vers Firebase Storage
 * Retourne { storagePath, downloadURL }
 */
export const uploadPartitionFile = (userId, file, onProgress) => {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const storagePath = `partitions/${userId}/${timestamp}_${safeName}`;

      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ storagePath, downloadURL });
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Enregistrer les métadonnées de la partition dans Firestore
 */
export const savePartitionMetadata = async (userId, data) => {
  const docRef = await addDoc(collection(db, 'partitions'), {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};
