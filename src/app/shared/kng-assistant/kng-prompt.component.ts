/**
 * TODO [Angular 16+ Migration]
 * Quand Angular sera migré vers v16+, remplacer l'import par:
 * import { ..., signal, computed } from '@angular/core';
 *
 * Et utiliser les Signals pour les états réactifs:
 * - isAssistantRunning = computed(() => this.currentState?.status === 'running');
 */
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Config, User, AssistantService, AssistantState } from 'kng2-core';
import { KngAudioNoteEnhancedComponent } from '../../common/kng-audio/components/kng-audio-note-enhanced/kng-audio-note-enhanced.component';
import { i18n } from 'src/app/common';

import './kng-assistant-wa';

/**
 * KngPromptComponent
 *
 * Composant de saisie du prompt avec support audio et suggestions.
 * Pattern inspiré de kng-prompt - appelle $assistant.chat() directement.
 */
@Component({
  selector: 'kng-prompt',
  templateUrl: './kng-prompt.component.html',
  styleUrls: ['./kng-prompt.component.scss']
})
export class KngPromptComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('textarea') textarea: ElementRef;
  @ViewChild('audioRecorder') audioRecorder: KngAudioNoteEnhancedComponent;

  @Input() agent: string = 'james';
  @Input() user: User;
  @Input() config: Config;
  @Input() autoRecord: boolean = false;
  @Input() messagesLimit: boolean = false;
  @Input() tips: Array<{ clazz?: string, label: string, action: string }> = [];
  @Input() prompts: string[] = [];
  @Input() placeholder: string = '';
  @Input() disclaimer: string = '';

  // ✅ Autocomplete commands configuration
  @Input() autocomplete: Array<{
    link: string;
    description: string;
    alias?: string[];
  }> = [];

  // ✅ Thinking mode
  @Input() thinking: boolean = false;

  // ✅ Events vers le parent (pour compatibilité)
  @Output() promptChange: EventEmitter<string> = new EventEmitter();
  @Output() chatRequest: EventEmitter<{ prompt?: string, audio?: string, thinking?: boolean }> = new EventEmitter();
  @Output() clearRequest: EventEmitter<void> = new EventEmitter();
  @Output() thinkingChange: EventEmitter<boolean> = new EventEmitter();

  // ✅ Event émis quand l'utilisateur envoie un message (pour recherche produits par le parent)
  @Output() chat: EventEmitter<string> = new EventEmitter();

  private destroy$ = new Subject<void>();

  prompt: string = '';
  promptHtml: string = '';
  currentState: AssistantState;
  showAudioRecorder: boolean = false;

  // ✅ Autocomplete suggestions - FIXME: nécessite KngAutocompleteAiService
  suggestions: any[] = [];
  selectedSuggestionIndex: number = -1;

  // ✅ Helps pour affichage rapide
  helps = {
    show: false,
    elems: [] as Array<{ label: string, query: string }>
  };

  // Input timeout pour debounce
  private inputTimeout: any = null;

  // TODO [Angular 16+ Migration] Remplacer par:
  // isAssistantRunning = computed(() => this.currentState?.status === 'running');
  isAssistantRunning(): boolean {
    return this.currentState?.status === 'running';
  }

  constructor(
    private $assistant: AssistantService,
    private $i18n: i18n,
    private $cdr: ChangeDetectorRef
  ) {
    this.user = new User({ displayName: 'Anonymous' });
  }

  get label() {
    return this.$i18n.label();
  }

  get store() {
    return this.config?.shared?.hub?.slug;
  }

  get uploadcareKey() {
    return this.config?.shared?.keys?.pubUpcare || '';
  }

  get audioIsRecording() {
    return this.audioRecorder?.audioState?.isRecording || false;
  }

  get audioIsProcessing() {
    return this.audioRecorder?.isProcessingOrTranscribing || false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
  }

  ngOnInit() {
    // ✅ Set default placeholder and disclaimer from i18n
    if (!this.placeholder) {
      this.placeholder = this.label.james_placeholder || 'Votre question?';
    }
    if (!this.disclaimer) {
      this.disclaimer = this.label.james_disclaimer || 'James peut se tromper. Pensez à vérifier les informations.';
    }

    // Subscribe to state changes
    this.$assistant.state$.pipe(
      takeUntil(this.destroy$),
      // Filter states by agent input
      filter(state => !this.agent || state.agent === this.agent || !state.agent)
    ).subscribe(state => {
      this.currentState = state;
      this.$cdr.markForCheck();
    });

    // Listen for cross-component prompt events
    this.$assistant.promptEvt$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(prompt => {
      if (prompt) {
        this.setPrompt(prompt);
      }
    });
  }

  ngAfterViewInit() {
    // Initialiser l'attribut data-empty pour le placeholder
    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;
      const textContent = element.textContent?.trim() || '';
      const innerHTML = element.innerHTML.trim();
      const isEmpty = !textContent && (
        innerHTML === '' ||
        innerHTML === '<br>' ||
        innerHTML === '<br/>' ||
        innerHTML === '<br />' ||
        /^<br\s*\/?>$/i.test(innerHTML)
      );
      element.setAttribute('data-empty', isEmpty.toString());
    }

    // ✅ Autorecord mode - déclenche l'enregistrement audio automatiquement
    if (this.autoRecord) {
      setTimeout(() => {
        this.triggerAutoRecord();
      }, 1000);
    }
  }

  /**
   * ✅ Déclenche l'enregistrement audio automatiquement (mode autorecord)
   */
  private async triggerAutoRecord() {
    if (!this.audioRecorder) {
      console.warn('⚠️ Audio recorder not ready for autorecord');
      return;
    }
    try {
      await this.audioRecorder.toggleRecording();
    } catch (error) {
      console.error('❌ Autorecord failed:', error);
    }
  }

  /**
   * Handle chat submission
   * ✅ Appelle $assistant.chat() directement comme dans l'original
   */
  onChat() {
    // Extraire le texte du contenteditable
    this.updatePromptFromEditor();

    if (this.isAssistantRunning() || !this.prompt?.trim()) return;

    this.suggestions = [];
    this.selectedSuggestionIndex = -1;

    // ✅ Appeler $assistant.chat() directement avec le bon format
    const params = {
      q: this.prompt,
      agent: this.agent,
      hub: this.store,
      thinking: this.thinking
    };

    this.$assistant.chat(params).subscribe({
      error: (err) => {
        console.error('Chat error:', err);
      }
    });

    // ✅ Emit event pour recherche produits par le parent
    this.chat.emit(this.prompt);

    // Emit event pour compatibilité avec le parent si nécessaire
    this.chatRequest.emit({ prompt: this.prompt, thinking: this.thinking });
    this.clearPrompt();
  }

  /**
   * Clear conversation
   * ✅ Appelle $assistant.history(clear: true) directement
   */
  onClear($event?: Event) {
    $event?.preventDefault();
    this.$assistant.history({ clear: true, agent: this.agent, hub: this.store }).subscribe();
    this.clearRequest.emit();
  }

  /**
   * Handle prompt tip click
   */
  onPromptTip($event: Event, action: string) {
    $event.preventDefault();
    this.prompt = action;
    this.onChat();
  }

  /**
   * Handle keyboard events
   */
  onKeyDown($event: KeyboardEvent) {
    switch ($event.key) {
      case 'Escape':
        this.suggestions = [];
        this.selectedSuggestionIndex = -1;
        break;
      case 'ArrowDown':
        if (!this.suggestions.length) return;
        $event.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        if (!this.suggestions.length) return;
        $event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Tab':
        if (this.selectedSuggestionIndex >= 0) {
          $event.preventDefault();
          this.onSelectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        }
        break;
      case 'Enter':
        if (this.selectedSuggestionIndex >= 0) {
          $event.preventDefault();
          this.onSelectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        } else if (this.suggestions.length > 0) {
          // ✅ Suggestions affichées mais aucune sélectionnée → sélectionner la première
          $event.preventDefault();
          this.onSelectSuggestion(this.suggestions[0]);
        } else if (!$event.shiftKey) {
          // Enter seul : soumettre, Shift+Enter : nouvelle ligne
          $event.preventDefault();
          this.onChat();
        }
        // Shift+Enter : laisser le comportement par défaut (nouvelle ligne)
        break;
      default:
        // Utiliser setTimeout pour éviter les appels trop fréquents
        setTimeout(() => {
          this.updatePromptFromEditor();
          // ✅ Trigger autocomplete search
          this.onAutocomplete(this.prompt);
        }, 0);
        break;
    }
  }

  /**
   * Handle input changes
   */
  onInput($event: Event) {
    // Debounce pour éviter les appels trop fréquents
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
    this.inputTimeout = setTimeout(() => {
      this.updatePromptFromEditor();
      this.inputTimeout = null;
    }, 50);
  }

  /**
   * Handle paste - strip formatting
   */
  onPaste($event: ClipboardEvent) {
    $event.preventDefault();

    const clipboard = $event.clipboardData;
    if (!clipboard) return;

    // Récupérer le HTML et le texte brut
    const html = clipboard.getData('text/html');
    const text = clipboard.getData('text/plain');

    // Utiliser le texte brut uniquement pour simplifier
    const content = text || '';

    if (!content) return;

    // Insérer le contenu à la position du curseur
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.insertTextAtCursor(content);
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(content));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    this.updatePromptFromEditor();
  }

  /**
   * Select a suggestion
   * ✅ Supporte les deux formats: { query } (ancien) et { link, description } (nouveau)
   */
  onSelectSuggestion(suggestion: any) {
    // ✅ Supporte les deux formats de suggestion
    const text = suggestion.link || suggestion.query || '';

    // Extraire le texte brut (au cas où il y aurait du HTML)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    this.prompt = tempDiv.textContent?.trim() || '';
    this.promptHtml = text;

    // Mettre à jour le contenteditable
    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;
      element.innerHTML = text;
      element.setAttribute('data-empty', (!this.prompt).toString());
    }

    this.suggestions = [];
    this.selectedSuggestionIndex = -1;
    this.textarea?.nativeElement?.focus();
  }

  /**
   * Toggle thinking mode
   */
  onThinkingChange($event: Event) {
    this.thinking = !this.thinking;
    this.thinkingChange.emit(this.thinking);
  }

  /**
   * ✅ Autocomplete - filtre local par link ou alias
   * Filtrage basé sur la configuration @Input autocomplete
   */
  onAutocomplete(query: string) {
    if (!query?.length || !this.autocomplete?.length) {
      this.suggestions = [];
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Filtre par link ou alias (startsWith pour queries courtes)
    const matchItem = (item: any) =>
      item.link.toLowerCase().startsWith(lowerQuery) ||
      item.alias?.some((a: string) => a.toLowerCase().startsWith(lowerQuery));

    if (query.length < 2) {
      this.suggestions = this.autocomplete.filter(matchItem);
      return;
    }

    // Pour queries plus longues, utiliser includes
    const matchItemIncludes = (item: any) =>
      item.link.toLowerCase().includes(lowerQuery) ||
      item.alias?.some((a: string) => a.toLowerCase().includes(lowerQuery));

    this.suggestions = this.autocomplete.filter(matchItemIncludes);
  }

  /**
   * Handle audio ready event from kng-audio-note-enhanced
   * ✅ Utilise la transcription comme prompt et lance le chat
   */
  onAudioReady($event: { type: string, audioUrl: string, transcription: string, cartUrl?: string, stream?: boolean }) {
    // ✅ Accepter uniquement type 'prompt' pour ce composant
    if ($event.type !== 'prompt') return;

    // Utiliser la transcription comme prompt
    if ($event.transcription) {
      this.setPrompt($event.transcription);
    }

    // Si ce n'est pas un stream en cours, envoyer le chat automatiquement
    if (!$event.stream) {
      this.showAudioRecorder = false;
      this.onChat();
    }
  }

  /**
   * Handle audio error
   */
  onAudioError($event: any) {
    console.error('❌ Audio error:', $event);
  }

  /**
   * Handle audio loading state
   */
  onAudioLoading($event: boolean) {
    this.$cdr.markForCheck();
  }

  /**
   * Toggle audio recorder (public API for parent components)
   */
  toggleAudioRecorder() {
    if (this.audioRecorder) {
      this.audioRecorder.toggleRecording();
    }
  }

  /**
   * Insérer du texte à la position du curseur
   */
  private insertTextAtCursor(text: string) {
    const element = this.textarea?.nativeElement;
    if (!element) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      element.innerHTML += text;
    }
  }

  /**
   * Mettre à jour prompt depuis le contenteditable
   */
  private updatePromptFromEditor() {
    if (!this.textarea?.nativeElement) return;

    const element = this.textarea.nativeElement as HTMLElement;
    const textContent = element.textContent?.trim() || '';
    this.prompt = textContent;
    this.promptHtml = element.innerHTML;
    this.promptChange.emit(this.prompt);

    // Gérer l'attribut data-empty pour le placeholder CSS
    const innerHTML = element.innerHTML.trim();
    const isEmpty = !textContent && (
      innerHTML === '' ||
      innerHTML === '<br>' ||
      innerHTML === '<br/>' ||
      innerHTML === '<br />' ||
      /^<br\s*\/?>$/i.test(innerHTML) ||
      /^(\s|<br\s*\/?>)*$/i.test(innerHTML)
    );
    element.setAttribute('data-empty', isEmpty.toString());
  }

  /**
   * Définir le prompt programmatiquement
   */
  private setPrompt(text: string) {
    this.prompt = text;
    this.promptHtml = text.replace(/\n/g, '<br>');

    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;
      element.innerHTML = this.promptHtml;

      // Placer le curseur à la fin
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      element.setAttribute('data-empty', (!text.trim()).toString());
    }
  }

  /**
   * Vider le prompt
   */
  private clearPrompt() {
    this.prompt = '';
    this.promptHtml = '';
    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;
      element.innerHTML = '';
      element.setAttribute('data-empty', 'true');
    }
  }
}
