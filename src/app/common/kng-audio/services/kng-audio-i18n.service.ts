export interface AudioLabels {
  // Titres
  title_item: string;
  title_support: string;
  title_helper: string;

  // Descriptions
  desc_item: string;
  desc_support: string;
  desc_helper: string;

  // Actions
  action_record: string;
  action_stop: string;
  action_clear: string;
  action_retry: string;
  action_dismiss: string;

  // États
  state_recording: string;
  state_processing: string;
  state_stopped: string;
  state_voice_detected: string;
  state_low_activity: string;
  state_silent: string;

  // Erreurs
  error_permission_denied: string;
  error_hardware_error: string;
  error_browser_not_supported: string;
  error_upload_failed: string;
  error_silent_audio: string;

  // Messages
  message_include_cart: string;
  message_processing: string;
  message_transcription: string;
  message_cart_shared: string;
  message_duration: string;
  message_type: string;
}

export const $i18n = {
  fr: {
    // Titres
    title_item: 'Note produit',
    title_support: 'Message support',
    title_helper: 'Assistant vocal',

    // Descriptions
    desc_item: 'Ajoutez une note vocale pour ce produit',
    desc_support: 'Décrivez votre problème ou question',
    desc_helper: 'Posez votre question à l\'assistant',

    // Actions
    action_record: 'Dicter',
    action_stop: 'Arrêter',
    action_clear: 'Supprimer',
    action_retry: 'Réessayer',
    action_dismiss: 'OK',

    // États
    state_recording: 'Enregistrement...',
    state_processing: 'Traitement en cours...',
    state_stopped: 'Arrêté',
    state_voice_detected: 'Voix détectée',
    state_low_activity: 'Activité faible',
    state_silent: 'Silencieux',

    // Erreurs
    error_permission_denied: 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.',
    error_hardware_error: 'Erreur d\'accès au microphone. Vérifiez que votre microphone est connecté.',
    error_browser_not_supported: 'Votre navigateur ne supporte pas l\'enregistrement audio',
    error_upload_failed: 'Échec de l\'upload du fichier audio',
    error_silent_audio: 'Aucun son détecté dans l\'enregistrement',

    // Messages
    message_include_cart: 'Inclure mon panier',
    message_processing: 'Transcription...',
    message_transcription: 'Transcription',
    message_cart_shared: 'Panier partagé',
    message_duration: 'Durée',
    message_type: 'Type'
  } as AudioLabels,

  en: {
    // Titres
    title_item: 'Product Note',
    title_support: 'Support Message',
    title_helper: 'Voice Assistant',

    // Descriptions
    desc_item: 'Add a voice note for this product',
    desc_support: 'Describe your problem or question',
    desc_helper: 'Ask your question to the assistant',

    // Actions
    action_record: 'Record',
    action_stop: 'Stop',
    action_clear: 'Clear',
    action_retry: 'Retry',
    action_dismiss: 'OK',

    // États
    state_recording: 'Recording...',
    state_processing: 'Processing...',
    state_stopped: 'Stopped',
    state_voice_detected: 'Voice detected',
    state_low_activity: 'Low activity',
    state_silent: 'Silent',

    // Erreurs
    error_permission_denied: 'Microphone access denied. Please allow access in your browser settings.',
    error_hardware_error: 'Microphone access error. Check that your microphone is connected.',
    error_browser_not_supported: 'Your browser does not support audio recording',
    error_upload_failed: 'Audio file upload failed',
    error_silent_audio: 'No sound detected in recording',

    // Messages
    message_include_cart: 'Include my cart',
    message_processing: 'Transcription...',
    message_transcription: 'Transcription',
    message_cart_shared: 'Shared cart',
    message_duration: 'Duration',
    message_type: 'Type'
  } as AudioLabels
};
