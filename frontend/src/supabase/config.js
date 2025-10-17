// ========================================
// SUPABASE DÉSACTIVÉ - MIGRATION VERS AWS S3
// ========================================
// Ce fichier n'est plus utilisé car l'application utilise maintenant AWS S3
// L'export vide est conservé pour éviter les erreurs d'import

console.warn('⚠️ Supabase est désactivé. L\'application utilise maintenant AWS S3.');

// Export vide pour compatibilité
export const supabase = {
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};
