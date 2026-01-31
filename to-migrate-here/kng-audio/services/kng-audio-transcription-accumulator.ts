/**
 * Classe pour gérer l'accumulation intelligente des transcriptions par phrases
 *
 * @description
 * Tokenise les transcriptions par phrases et produit des prompts optimisés pour Whisper
 * en utilisant la dernière phrase comme contexte pour améliorer la continuité.
 * Gère les répétitions et corrections de Whisper via overlap de suffixe.
 *
 * @example
 * ```typescript
 * const accumulator = new TranscriptionAccumulator();
 *
 * // Première transcription
 * accumulator.addTranscription("Bonjour, comment allez-vous ?");
 *
 * // Deuxième transcription avec contexte
 * const prompt = accumulator.getPromptForWhisper(); // "Bonjour, comment allez-vous ?"
 * // Après transcription Whisper...
 * accumulator.addTranscription("Je vais bien, merci.");
 *
 * // Résultat final
 * const fullText = accumulator.getFullText(); // "Bonjour, comment allez-vous ? Je vais bien, merci."
 * ```
 */
export class TranscriptionAccumulator {
  private sentences: string[] = [];

  /**
   * Normalise un texte (espaces comprimés, trim)
   */
  private normalize(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Tokenise un texte en phrases avec Intl.Segmenter (fallback regex)
   *
   * @param text - Texte à tokeniser
   * @returns Tableau de phrases
   *
   * @description
   * Utilise Intl.Segmenter pour une tokenisation locale-aware (français),
   * avec fallback regex pour les environnements non supportés.
   */
  private tokenizeSentences(text: string): string[] {
    if (!text || !text.trim()) {
      return [];
    }

    //
    // Intl.Segmenter si disponible (locale-aware, gère Dr., M., etc.)
    if (typeof (Intl as any).Segmenter !== 'undefined') {
      try {
        const segmenter = new (Intl as any).Segmenter('fr', { granularity: 'sentence' });
        const segments = [...segmenter.segment(text)];
        return segments
          .map((s: any) => s.segment.trim())
          .filter(Boolean);
      } catch {
        // Fallback si erreur
      }
    }

    //
    // Fallback regex: . ! ? suivis d'un espace ou fin de texte
    const sentenceRegex = /[.!?]+(?:\s+|$)/g;
    const sentences: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentence = text.substring(lastIndex, match.index + match[0].length).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }

    // Ajouter la dernière partie si elle ne se termine pas par une ponctuation
    const remaining = text.substring(lastIndex).trim();
    if (remaining) {
      sentences.push(remaining);
    }

    return sentences;
  }

  /**
   * Extrait le texte additionnel en détectant l'overlap de suffixe/préfixe
   * Gère les cas où Whisper corrige légèrement le texte précédent
   *
   * @param lastSentence - Dernière phrase existante
   * @param firstNewSentence - Première phrase de la nouvelle transcription
   * @returns Texte additionnel après l'overlap, ou la phrase complète si pas d'overlap
   */
  private extractAdditionalFromOverlap(lastSentence: string, firstNewSentence: string): string {
    const a = this.normalize(lastSentence).split(' ');
    const b = this.normalize(firstNewSentence).split(' ');
    const maxOverlap = Math.min(a.length, b.length);

    //
    // Chercher le plus long overlap entre suffixe de A et préfixe de B
    for (let overlap = maxOverlap; overlap > 0; overlap--) {
      const suffixA = a.slice(a.length - overlap).join(' ');
      const prefixB = b.slice(0, overlap).join(' ');
      if (suffixA === prefixB) {
        return b.slice(overlap).join(' ');
      }
    }

    // Pas d'overlap convaincant → retourner la phrase complète
    return firstNewSentence;
  }

  /**
   * Ajoute une nouvelle transcription (1-2 phrases) à l'accumulateur
   *
   * @param newTranscription - Nouvelle transcription retournée par Whisper (1-2 phrases)
   *
   * @description
   * Tokenise la nouvelle transcription et l'ajoute aux phrases existantes.
   * Gère les répétitions via overlap de suffixe (robuste aux corrections Whisper).
   */
  addTranscription(newTranscription: string): void {
    if (!newTranscription || !newTranscription.trim()) {
      return;
    }

    const trimmedNew = newTranscription.trim();

    // ✅ CAS 1: Première transcription - ajouter directement
    if (this.sentences.length === 0) {
      const newSentences = this.tokenizeSentences(trimmedNew);
      this.sentences.push(...newSentences);
      return;
    }

    const fullText = this.getFullText();
    const normalizedFull = this.normalize(fullText);
    const normalizedNew = this.normalize(trimmedNew);

    // ✅ CAS 2: Whisper a retourné le texte complet incluant le contexte
    // Rester 100% en mode normalisé pour éviter les bugs de coupe
    if (normalizedNew.startsWith(normalizedFull)) {
      const prevWords = normalizedFull.split(' ');
      const newWords = normalizedNew.split(' ');
      const additionalWords = newWords.slice(prevWords.length);
      const additionalText = additionalWords.join(' ').trim();

      if (additionalText) {
        const newSentences = this.tokenizeSentences(additionalText);
        this.sentences.push(...newSentences);
      }
      return;
    }

    // ✅ CAS 3: Whisper a retourné seulement les nouvelles phrases
    // Utiliser overlap de suffixe pour détecter les répétitions partielles
    const newSentences = this.tokenizeSentences(trimmedNew);
    if (newSentences.length === 0) {
      return;
    }

    const lastSentence = this.sentences[this.sentences.length - 1];
    const firstNewSentence = newSentences[0];

    //
    // Extraire le texte additionnel via overlap de suffixe
    const additionalFirst = this.extractAdditionalFromOverlap(lastSentence, firstNewSentence);
    const normalizedAdditional = this.normalize(additionalFirst);
    const normalizedFirstNew = this.normalize(firstNewSentence);

    if (normalizedAdditional === normalizedFirstNew) {
      // Pas d'overlap convaincant → ajouter toutes les nouvelles phrases
      this.sentences.push(...newSentences);
    } else if (additionalFirst) {
      // Overlap trouvé → étendre la dernière phrase avec le nouveau contenu
      this.sentences[this.sentences.length - 1] = `${lastSentence} ${additionalFirst}`.trim();
      if (newSentences.length > 1) {
        this.sentences.push(...newSentences.slice(1));
      }
    } else {
      // additionalFirst vide → répétition complète, ajouter seulement les suivantes
      if (newSentences.length > 1) {
        this.sentences.push(...newSentences.slice(1));
      }
    }
  }

  /**
   * Produit un prompt pour Whisper avec la dernière phrase comme contexte
   *
   * @returns Prompt à envoyer à Whisper (dernière phrase ou texte complet si < 200 caractères)
   *
   * @description
   * Retourne la dernière phrase comme contexte pour Whisper.
   * Si le texte complet fait moins de 200 caractères, retourne tout le texte.
   */
  getPromptForWhisper(): string {
    if (this.sentences.length === 0) {
      return '';
    }

    const fullText = this.getFullText();

    // Si le texte complet est court, l'utiliser entièrement
    if (fullText.length <= 200) {
      return fullText;
    }

    // Sinon, utiliser seulement la dernière phrase (ou les 2 dernières si très courtes)
    const lastSentence = this.sentences[this.sentences.length - 1];

    // Si la dernière phrase est très courte, prendre aussi l'avant-dernière
    if (lastSentence.length < 50 && this.sentences.length > 1) {
      const lastTwo = this.sentences.slice(-2).join(' ');
      return lastTwo.length <= 200 ? lastTwo : lastSentence;
    }

    return lastSentence;
  }

  /**
   * Retourne le texte complet accumulé
   *
   * @returns Texte complet avec toutes les phrases jointes
   */
  getFullText(): string {
    return this.sentences.join(' ');
  }

  /**
   * Retourne le nombre de phrases accumulées
   */
  getSentenceCount(): number {
    return this.sentences.length;
  }

  /**
   * Réinitialise l'accumulateur
   */
  reset(): void {
    this.sentences = [];
  }

  /**
   * Retourne toutes les phrases sous forme de tableau
   */
  getSentences(): string[] {
    return [...this.sentences];
  }
}

