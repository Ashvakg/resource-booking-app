// lib/auth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";

// Register new user and assign role
export async function registerUser(email: string, password: string, role: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    role,
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function getUserRole(uid: string): Promise<string | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? (userDoc.data().role as string) : null;
}
