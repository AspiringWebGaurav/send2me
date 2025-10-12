"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const fallbackConfig = {
  apiKey: "AIzaSyDpiQBC2JOtqUMEwH7SGRCFFZi6DGFJONA",
  authDomain: "send2me-f4f3b.firebaseapp.com",
  projectId: "send2me-f4f3b",
  storageBucket: "send2me-f4f3b.firebasestorage.app",
  messagingSenderId: "1032278197563",
  appId: "1:1032278197563:web:dbc4a7abc5c62e1c09231e",
  measurementId: "G-2BWKZX7TQP",
};

function resolveConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? fallbackConfig.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? fallbackConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? fallbackConfig.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? fallbackConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? fallbackConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? fallbackConfig.appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? fallbackConfig.measurementId,
  };

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Firebase configuration is incomplete. Check your environment variables.");
  }

  return config;
}

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK cannot be initialized on the server.");
  }
  if (!app) {
    const config = resolveConfig();
    app = getApps().length ? getApps()[0] : initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export const googleProvider = new GoogleAuthProvider();
