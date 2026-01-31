export interface AudioLabels {
  // Titres
  title_prompt: string;
  title_support: string;
  title_helper: string;

  // Descriptions
  desc_prompt: string;
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
  state_transcribing: string;

  // Erreurs
  error_permission_denied: string;
  error_hardware_error: string;
  error_browser_not_supported: string;
  error_upload_failed: string;
  error_silent_audio: string;
  error_microphone_occupied: string;
  error_microphone_not_found: string;
  error_microphone_config: string;
  error_technical: string;
  error_unknown: string;
  error_already_recording: string;

  // Messages
  message_include_cart: string;
  message_processing: string;
  message_transcription: string;
  message_cart_shared: string;
  message_duration: string;
  message_type: string;

  // Instructions navigateurs
  instructions_chrome: string;
  instructions_firefox: string;
  instructions_safari: string;
  instructions_edge: string;
  instructions_samsung: string;
  instructions_generic: string;

  // Instructions hardware
  instructions_microphone_connect: string;
  instructions_microphone_close_apps: string;
  instructions_microphone_config: string;
  instructions_technical_support: string;
  instructions_retry_later: string;

  // Messages système
  system_browser_not_supported: string;
  system_navigator_not_supported: string;
  system_permission_retry: string;
  system_permission_reload: string;
}

export const $i18n = {
  fr: {
    // Titres
    title_prompt: 'Note produit',
    title_support: 'Message support',
    title_helper: 'Assistant vocal',

    // Descriptions
    desc_prompt: 'Ajoutez une note vocale pour ce produit',
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
    state_processing: 'Trapromptent en cours...',
    state_stopped: 'Arrêté',
    state_voice_detected: 'Voix détectée',
    state_low_activity: 'Activité faible',
    state_silent: 'Silencieux',
    state_transcribing: 'en cours...',

    // Erreurs
    error_permission_denied: 'Accès au microphone refusé',
    error_hardware_error: 'Erreur d\'accès au microphone',
    error_browser_not_supported: 'Votre navigateur ne supporte pas l\'enregistrement audio',
    error_upload_failed: 'Échec de l\'upload du fichier audio',
    error_silent_audio: 'Aucun son détecté dans l\'enregistrement',
    error_microphone_occupied: 'Microphone occupé ou inaccessible',
    error_microphone_not_found: 'Aucun microphone détecté',
    error_microphone_config: 'Configuration microphone incompatible',
    error_technical: 'Erreur de configuration',
    error_unknown: 'Erreur inconnue d\'accès au microphone',
    error_already_recording: 'Enregistrement déjà en cours',

    // Messages
    message_include_cart: 'Inclure mon panier',
    message_processing: 'Transcription...',
    message_transcription: 'Transcription',
    message_cart_shared: 'Panier partagé',
    message_duration: 'Durée',
    message_type: 'Type',

    // Instructions navigateurs
    instructions_chrome: 'Chrome: Cliquez sur l\'icône 🔒 dans la barre d\'adresse → Microphone → Autoriser. Puis rechargez la page.',
    instructions_firefox: 'Firefox: Cliquez sur l\'icône 🔒 dans la barre d\'adresse → Permissions → Microphone → Autoriser. Puis rechargez la page.',
    instructions_safari: 'Safari: Menu Safari → Préférences → Sites web → Microphone → Autoriser pour ce site. Puis rechargez la page.',
    instructions_edge: 'Edge: Cliquez sur l\'icône 🔒 dans la barre d\'adresse → Microphone → Autoriser. Puis rechargez la page.',
    instructions_samsung: 'Samsung Internet: Menu → Paramètres → Sites web → Microphone → Autoriser pour ce site. Puis rechargez la page.',
    instructions_generic: 'Autorisez l\'accès au microphone dans les paramètres de votre navigateur, puis rechargez la page.',

    // Instructions hardware
    instructions_microphone_connect: 'Vérifiez qu\'un microphone est connecté et activé dans les paramètres système.',
    instructions_microphone_close_apps: 'Le microphone est peut-être utilisé par une autre application. Fermez les autres applications et réessayez.',
    instructions_microphone_config: 'Votre microphone ne supporte pas les paramètres requis.',
    instructions_technical_support: 'Problème technique. Contactez le support si le problème persiste.',
    instructions_retry_later: 'Réessayez dans quelques instants. Si le problème persiste, rechargez la page.',

    // Messages système
    system_browser_not_supported: 'Votre navigateur ne supporte pas l\'enregistrement audio',
    system_navigator_not_supported: 'Navigateur non supporté',
    system_permission_retry: 'Permission refusée - rechargez la page pour réessayer',
    system_permission_reload: 'Rechargez la page pour réessayer'
  } as AudioLabels,

  en: {
    // Titres
    title_prompt: 'Product Note',
    title_support: 'Support Message',
    title_helper: 'Voice Assistant',

    // Descriptions
    desc_prompt: 'Add a voice note for this product',
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
    state_transcribing: 'in progress...',

    // Erreurs
    error_permission_denied: 'Microphone access denied',
    error_hardware_error: 'Microphone access error',
    error_browser_not_supported: 'Your browser does not support audio recording',
    error_upload_failed: 'Audio file upload failed',
    error_silent_audio: 'No sound detected in recording',
    error_microphone_occupied: 'Microphone busy or inaccessible',
    error_microphone_not_found: 'No microphone detected',
    error_microphone_config: 'Incompatible microphone configuration',
    error_technical: 'Configuration error',
    error_unknown: 'Unknown microphone access error',
    error_already_recording: 'Recording already in progress',

    // Messages
    message_include_cart: 'Include my cart',
    message_processing: 'Transcription...',
    message_transcription: 'Transcription',
    message_cart_shared: 'Shared cart',
    message_duration: 'Duration',
    message_type: 'Type',

    // Instructions navigateurs
    instructions_chrome: 'Chrome: Click the 🔒 icon in the address bar → Microphone → Allow. Then reload the page.',
    instructions_firefox: 'Firefox: Click the 🔒 icon in the address bar → Permissions → Microphone → Allow. Then reload the page.',
    instructions_safari: 'Safari: Safari Menu → Preferences → Websites → Microphone → Allow for this site. Then reload the page.',
    instructions_edge: 'Edge: Click the 🔒 icon in the address bar → Microphone → Allow. Then reload the page.',
    instructions_samsung: 'Samsung Internet: Menu → Settings → Websites → Microphone → Allow for this site. Then reload the page.',
    instructions_generic: 'Allow microphone access in your browser settings, then reload the page.',

    // Instructions hardware
    instructions_microphone_connect: 'Check that a microphone is connected and enabled in system settings.',
    instructions_microphone_close_apps: 'The microphone may be used by another application. Close other applications and try again.',
    instructions_microphone_config: 'Your microphone does not support the required settings.',
    instructions_technical_support: 'Technical problem. Contact support if the problem persists.',
    instructions_retry_later: 'Try again in a few moments. If the problem persists, reload the page.',

    // Messages système
    system_browser_not_supported: 'Your browser does not support audio recording',
    system_navigator_not_supported: 'Browser not supported',
    system_permission_retry: 'Permission denied - reload the page to try again',
    system_permission_reload: 'Reload the page to try again'
  } as AudioLabels
};
