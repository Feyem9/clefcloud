#!/usr/bin/env node

/**
 * Script de vérification de la configuration ClefCloud
 * Lance ce script pour vérifier que tout est correctement configuré
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration ClefCloud...\n');

let hasErrors = false;
let hasWarnings = false;

// Vérifier les fichiers essentiels
const essentialFiles = [
  'package.json',
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'firebase.json',
  'firestore.rules',
  'storage.rules',
  '.env.example',
  'src/App.jsx',
  'src/main.jsx',
  'src/index.css',
  'src/firebase/config.js',
  'src/contexts/AuthContext.jsx',
  'src/components/Layout/Layout.jsx',
  'src/components/Layout/Header.jsx',
  'src/components/Layout/Footer.jsx',
  'src/components/ProtectedRoute.jsx',
  'src/pages/Home.jsx',
  'src/pages/Login.jsx',
  'src/pages/Signup.jsx',
  'src/pages/Library.jsx',
  'src/pages/Upload.jsx',
  'src/pages/Messe.jsx',
  'src/pages/Contact.jsx'
];

console.log('📁 Vérification des fichiers essentiels...');
essentialFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MANQUANT`);
    hasErrors = true;
  }
});

// Vérifier le fichier .env
console.log('\n🔐 Vérification de la configuration Firebase...');
if (fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('  ✅ Fichier .env trouvé');
  
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=your_`)) {
      console.log(`  ✅ ${varName} configuré`);
    } else {
      console.log(`  ⚠️  ${varName} - NON CONFIGURÉ`);
      hasWarnings = true;
    }
  });
} else {
  console.log('  ⚠️  Fichier .env non trouvé');
  console.log('     Créez-le avec: cp .env.example .env');
  hasWarnings = true;
}

// Vérifier node_modules
console.log('\n📦 Vérification des dépendances...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('  ✅ node_modules trouvé');
  
  // Vérifier les dépendances clés
  const keyDeps = ['react', 'react-router-dom', 'firebase', 'tailwindcss'];
  keyDeps.forEach(dep => {
    if (fs.existsSync(path.join(__dirname, 'node_modules', dep))) {
      console.log(`  ✅ ${dep} installé`);
    } else {
      console.log(`  ❌ ${dep} - NON INSTALLÉ`);
      hasErrors = true;
    }
  });
} else {
  console.log('  ❌ node_modules non trouvé');
  console.log('     Lancez: npm install');
  hasErrors = true;
}

// Vérifier package.json
console.log('\n📄 Vérification de package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  
  if (packageJson.dependencies && packageJson.dependencies.firebase) {
    console.log('  ✅ Firebase dans les dépendances');
  } else {
    console.log('  ❌ Firebase manquant dans les dépendances');
    hasErrors = true;
  }
  
  if (packageJson.dependencies && packageJson.dependencies['react-router-dom']) {
    console.log('  ✅ React Router dans les dépendances');
  } else {
    console.log('  ❌ React Router manquant dans les dépendances');
    hasErrors = true;
  }
  
  if (packageJson.scripts && packageJson.scripts.dev) {
    console.log('  ✅ Script "dev" configuré');
  } else {
    console.log('  ❌ Script "dev" manquant');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ Erreur lors de la lecture de package.json');
  hasErrors = true;
}

// Résumé
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERREURS DÉTECTÉES - L\'application ne fonctionnera pas correctement');
  console.log('\nActions requises:');
  console.log('  1. Vérifiez les fichiers manquants ci-dessus');
  console.log('  2. Lancez: npm install');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  AVERTISSEMENTS DÉTECTÉS - Configuration incomplète');
  console.log('\nActions recommandées:');
  console.log('  1. Créez votre projet Firebase');
  console.log('  2. Créez le fichier .env avec vos credentials');
  console.log('  3. Consultez GUIDE_DEMARRAGE.md pour plus de détails');
  process.exit(0);
} else {
  console.log('✅ TOUT EST CONFIGURÉ CORRECTEMENT !');
  console.log('\nVous pouvez lancer l\'application avec:');
  console.log('  npm run dev');
  console.log('\nConsultez PROCHAINES_ETAPES.md pour la suite');
  process.exit(0);
}
