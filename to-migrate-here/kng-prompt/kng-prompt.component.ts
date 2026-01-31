import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { KngAssistantAiService } from '../kng-assistant-ai.service';
import { SlPopup } from '@shoelace-style/shoelace';
import { KngAutocompleteAiService } from '../kng-autocomplete-ai.service';
import { KngAudioNoteEnhancedComponent } from '../kng-audio';
import { KngMemoriesService, DiscussionMemory } from '../kng-memories.service';
import { filter } from 'rxjs/operators';
import { isAdmin, Me } from '../auth.service';


@Component({
    selector: 'kng-prompt',
    templateUrl: './kng-prompt.component.html',
    styleUrls: ['./kng-prompt.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, KngAudioNoteEnhancedComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngPromptComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();

  @Input() agent: string = 'current';  // ✅ Agent initial par défaut
  @Input() me: Me | undefined = undefined;
  @Input() autoRecord: boolean = false;  // ✅ Mode autorecord - déclenche l'enregistrement automatiquement

  messagesCount = 0;
  messagesLimit = 0;
  isAssistantRuning = false;
  prompt = '';  // Texte brut pour l'API
  promptHtml = '';  // HTML pour le contenteditable
  currentAgent = '';  // ✅ Track current agent
  showAudioRecorder = false;  // ✅ Contrôle l'affichage du composant audio

  // ✅ RAG selection
  defaultRag: string = '';  // Will be set to default RAG from server
  availableRags: Array<{value: string, label: string, hint: string, isDefault?: boolean}> = [];

  // ✅ Thinking mode for LLM reasoning
  thinking = false;

  // ✅ Selected memory (MEM_MANUAL) - from KngMemoriesService
  selectedMemory: DiscussionMemory | null = null;

  // ✅ Getter pour Date.now() accessible dans le template

  autocomplete:any[] = [
    { link: '/aide', alias: ['/help'], description: 'Aide générale commandes' },
    { link: '/corrige ', alias: ['/correct ', '/fix '], description: 'Corriger orthographe et grammaire' },
    { link: '/fr ', alias: [], description: 'Traduire en français' },
    { link: '/en ', alias: [], description: 'Traduire en anglais' },
    { link: '/de ', alias: [], description: 'Traduire en allemand' },
    { link: '/cs', alias: ['/resume', '/summary'], description: 'Résumé un sujet' },
    { link: '/continue', alias: ['/cont'], description: 'Poursuivre réponse précédente' },
    { link: '/rule ', alias: ['/proc ', '/procedure '], description: 'Trouver procédure interne' },
    { link: '/index', alias: ['/corpus', '/proc', '/procedures'], description: 'Liste des procédures disponibles' },
    { link: '/daily', alias: ['/jour', '/today'], description: 'Emails et agenda du jour' },
    { link: '/emails', alias: ['/mail', '/mails'], description: 'Emails non lus récents' },
    { link: '/semails', alias: ['/search', '/cherche'], description: 'Recherche emails dans inbox' },
    { link: '/web', alias: ['/search', '/google'], description: 'Recherche web externe' },
    { link: '/fao', alias: [], description: 'Rechercher FAO [faillites, APA, etc.]' },
    { link: '/client ', alias: ['/intervenant '], description: 'Détails intervenant' },
    { link: '/locataire ', alias: ['/loc '], description: 'Détails locataire' },
    { link: '/immeuble ', alias: ['/imm '], description: 'Détails immeuble <nom/id>' },
    { link: '/report', alias: ['/recap'], description: 'Recevoir récap par e-mail' },
    { link: '/feedback ', alias: ['/bug ', '/support '], description: 'Envoyer feedback support Edgar' }
  ];
  tips:any[] = [
    {label:'<strong>Faillites FAO</strong>',prompt:'Recherche les faillites du jour depuis la FAO'},
    {label:'<strong>Intervenant</strong>',prompt:'Cherche les informations de l\'intervenant'},
  ];

  helps = {
    show: false,
    /**
     * Liste des aides/commandes prédéfinies pour l'utilisateur.
     * - Chacune possède un lien (commande ou raccourci) et une description accessible rapide.
     */
    elems: [
    ]
  }

  i18n = {
    james_reset_action: 'Reset',
    james_disclaimer: 'James can make mistakes. Consider checking recipes before feeding kids',
  }

  @ViewChild('textarea') textarea!: ElementRef;
  @ViewChild('audioRecorder') audioRecorder!: KngAudioNoteEnhancedComponent;
  selectedSuggestionIndex = -1;
  suggestions: any[] = [];
  #inputTimeout: any = null;  // Pour debounce l'input

  @ViewChild('popup') popup!: SlPopup;

  constructor(
    private $assistant:KngAssistantAiService,
    private $autocomplete:KngAutocompleteAiService,
    private $memories: KngMemoriesService,
    private $http: HttpClient
  ) { }

  get label() {
    return this.i18n;
  }

  // ✅ Get current RAG display name
  get ragName(): string {
    const currentRag = this.availableRags.find(rag => rag.value === this.defaultRag);
    return currentRag?.label || 'Base de connaissances';
  }

  get isAdmin(): boolean {
    return this.me ? isAdmin(this.me) : false;
  }

  ngOnInit(): void {
    // ✅ Initialize currentAgent with input agent
    this.currentAgent = this.agent || 'current';

    // ✅ Load available RAGs from server
    this.loadAvailableRAGs();

    this.$assistant.state$
      .pipe(
        // ✅ Filter states by agent input
        filter(state => !this.agent || state.agent === this.agent || !state.agent)
      )
      .subscribe(state => {
        this.isAssistantRuning = !!(state.status&&state.status=='running');
        // Keep track of the actual running agent
        if (state.agent) {
          this.currentAgent = state.agent;
        }
      });

    // ✅ NEW: Listen for cross-component prompt events
    this.$assistant.promptEvt$.subscribe(prompt => {
      if(prompt) {
        this.setPrompt(prompt);
      }
    });

    // ✅ Subscribe to selected memory (combines selectedMemoryId$ + memories$ to get full object)
    combineLatest([
      this.$memories.selectedMemoryId$,
      this.$memories.memories$
    ]).pipe(
      takeUntil(this._destroying$),
      map(([id, memories]) => id ? memories.find(m => m.id === id) || null : null)
    ).subscribe((memory: DiscussionMemory | null) => {
      this.selectedMemory = memory;
    });

    // this.$autocomplete.autocompleteResults$.subscribe((results:any) => {
    //   if(this.isAssistantRuning) {
    //     return;
    //   }
    //   this.suggestions = results.map(this.highlight) as any[];
    // });

    // ✅ Transcriptions gérées directement par le composant audio modernisé

  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  /**
   * ✅ Désélectionne la mémoire active (MEM_MANUAL)
   */
  clearSelectedMemory(): void {
    this.$memories.clearSelectedMemory();
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

    //
    // ✅ Autorecord mode - déclenche l'enregistrement audio automatiquement
    // Délai pour s'assurer que le composant audio est prêt
    if (this.autoRecord) {
      setTimeout(() => {
        this.autoRecord = false;
        this.triggerAutoRecord();
      }, 1000);
    }
  }

  /**
   * ✅ Déclenche l'enregistrement audio automatiquement (mode autorecord)
   * Note: La permission microphone doit avoir été accordée précédemment
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

  // ✅ Load available RAGs from server
  loadAvailableRAGs() {
    this.$http.get<{rags: Array<{name: string, status: string, isDefault: boolean}>, default: string}>('/api/rag', {
      withCredentials: true,
      headers: {
        'ngsw-bypass': 'true',
        'Cache-Control': 'no-cache'
      }
    }).subscribe({
      next: (response) => {
        // Map server RAG names to display labels
        this.availableRags = response.rags
          .filter(rag => rag.status === 'active')
          .map(rag => ({
            value: rag.name,
            label: this.getRAGLabel(rag.name),
            hint: this.getRAGHint(rag.name),
            isDefault: rag.isDefault
          }));

        // Set default RAG
        this.defaultRag = response.default || '';
      },
      error: (error) => {
        console.error('❌ Error loading RAGs:', error);
        // Fallback to empty list
        this.availableRags = [];
      }
    });
  }

  // ✅ Map RAG name to display label
  getRAGLabel(ragName: string): string {
    // You can customize these labels based on your RAG naming convention
    if (ragName.includes('prod') || ragName.includes('stable')) {
      return 'Production';
    } else if (ragName.includes('draft') || ragName.includes('dev')) {
      return 'Édition';
    } else if (ragName.includes('genesis') || ragName.includes('initial')) {
      return 'Genesis';
    }
    return ragName; // Fallback to raw name
  }

  // ✅ Map RAG name to display hint
  getRAGHint(ragName: string): string {
    if (ragName.includes('prod') || ragName.includes('stable')) {
      return 'Base de connaissances de production';
    } else if (ragName.includes('draft') || ragName.includes('dev')) {
      return 'Base de connaissances en rédaction';
    } else if (ragName.includes('genesis') || ragName.includes('initial')) {
      return 'Base de connaissances initiale';
    }
    return 'Base de connaissances'; // Fallback
  }

  highlight(entry:any) {
    // Découpe les mots, retire les blancs, échappe les caractères spéciaux regex
    // const words = query
    //   .split(/\s+/)
    //   .filter(Boolean)
    //   .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    const words = entry.terms

    if (!words.length) return entry;

    const regex = new RegExp(`(${words.join('|')})`, 'gi')

    entry.query = entry.query.replace(regex, match => `<b>${match}</b>`)
    return entry;
  }

  // ✅ Nouvelle méthode pour afficher/masquer l'enregistreur audio
  toggleAudioRecorder() {
    this.showAudioRecorder = !this.showAudioRecorder;
  }

  onThinkingChange(event: any) {
    this.thinking = !this.thinking;
  }

  // ✅ Gestion du résultat audio avec transcription
  onAudioReady(audioResult: any) {

    //console.log('🎤 Audio transcrit:', audioResult);
    if(audioResult.type !== 'prompt') {
      return;
    }

    // Utiliser la transcription comme prompt
    if (audioResult.transcription) {
      this.setPrompt(audioResult.transcription);
    }

    if(!audioResult.stream) {
      // Masquer l'enregistreur à la fin du stream
      this.showAudioRecorder = false;
      this.onChat();
    }

  }

  // ✅ Gestion des erreurs audio
  onAudioError(error: any) {
    console.error('❌ Erreur audio:', error);
    // Optionnel : afficher un message d'erreur à l'utilisateur
  }

  onChat($event?:any) {
    // Extraire le texte du contenteditable
    this.updatePromptFromEditor();

    if (!this.prompt.trim()) {
      return;
    }

    this.suggestions = [];
    this.selectedSuggestionIndex = -1;

    //
    // ✅ Collect rules (selected MEM_MANUAL memory IDs)
    const rules = this.selectedMemory ? [this.selectedMemory.id] : undefined;

    this.$assistant.chat(this.prompt, {
      runAgent: this.agent,
      ragname: this.defaultRag,
      thinking: this.thinking,
      rules
    }).subscribe({
      error: (status) => {
        // Erreur gérée silencieusement
      }
    });
    this.clearPrompt();
  }

  onClear($event?:any) {
    this.$assistant.history(true, this.agent).subscribe();
    this.clearPrompt();
  }

  onTip(tip:any) {
    this.updatePromptFromEditor();
    const newPrompt = tip.prompt + "\n" + this.prompt;
    this.setPrompt(newPrompt);
    const rules = this.selectedMemory ? [this.selectedMemory.id] : undefined;
    this.$assistant.chat(this.prompt, {runAgent: this.agent, ragname: this.defaultRag, thinking: this.thinking, rules}).subscribe();
    this.clearPrompt();
  }

  // ✅ Handle RAG selection change
  onRagChange(event: any) {
    // Shoelace passes the selected item in event.detail.item
    const selectedValue = event.detail?.item?.value || event.target?.value;
    if (selectedValue) {
      this.defaultRag = selectedValue;
    }
  }

  onAutocomplete(query: string) {
    if(!query.length) {
      this.suggestions = [];
      return;
    }

    //
    // Filtre par link ou alias
    const matchItem = (item: any) =>
      item.link.startsWith(query) || item.alias?.some((a: string) => a.startsWith(query));

    if (query.length < 2) {
      this.suggestions = this.autocomplete.filter(matchItem);
      return;
    }

    const matchItemIncludes = (item: any) =>
      item.link.includes(query) || item.alias?.some((a: string) => a.includes(query));
    this.suggestions = this.autocomplete.filter(matchItemIncludes);
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.suggestions = [];
        this.selectedSuggestionIndex = -1;
        break;
      case 'ArrowDown':
        if (!this.suggestions.length) return;
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        if (!this.suggestions.length) return;
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Tab':
        if (this.selectedSuggestionIndex >= 0) {
          event.preventDefault();
          this.onSelectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        }
        break;
      case 'Enter':
        if (this.selectedSuggestionIndex >= 0) {
          event.preventDefault();
          this.onSelectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        } else if (this.suggestions.length > 0) {
          //
          // Suggestions affichées mais aucune sélectionnée → sélectionner la première
          event.preventDefault();
          this.onSelectSuggestion(this.suggestions[0]);
        } else if (!event.shiftKey) {
          // Enter seul : soumettre, Shift+Enter : nouvelle ligne
          event.preventDefault();
          this.onChat();
        }
        // Shift+Enter : laisser le comportement par défaut (nouvelle ligne)
        break;
      default:
        // Ne pas appeler updatePromptFromEditor() ici pour éviter de perturber le curseur
        // L'événement 'input' gérera la mise à jour automatiquement
        // Utiliser setTimeout pour éviter les appels trop fréquents
        setTimeout(() => {
          this.updatePromptFromEditor();
          this.onAutocomplete(this.prompt);
        }, 0);
        break;
    }
  }

  // ✅ Gestion de l'input dans le contenteditable
  onInput(event: Event) {
    // Debounce pour éviter les appels trop fréquents qui pourraient perturber le curseur
    if (this.#inputTimeout) {
      clearTimeout(this.#inputTimeout);
    }
    this.#inputTimeout = setTimeout(() => {
      this.updatePromptFromEditor();
      this.#inputTimeout = null;
    }, 50);  // 50ms de délai pour laisser le navigateur terminer la mise à jour du DOM
  }

  // ✅ Gestion du paste pour convertir HTML en texte formaté
  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const clipboard = event.clipboardData;
    if (!clipboard) return;

    // Récupérer le HTML et le texte brut
    const html = clipboard.getData('text/html');
    const text = clipboard.getData('text/plain');

    // Utiliser le HTML s'il est disponible, sinon le texte brut
    const content = html || text;

    if (!content) return;

    // Convertir le HTML en texte formaté simple (garde les balises de base)
    const formattedContent = this.convertHtmlToFormattedText(content);

    // Insérer le contenu à la position du curseur
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Si pas de sélection, insérer à la fin
      this.insertTextAtCursor(formattedContent);
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Créer un élément temporaire pour parser le HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedContent;

      // Insérer les nœuds
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      range.insertNode(fragment);

      // Repositionner le curseur après l'insertion
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Mettre à jour le prompt
    this.updatePromptFromEditor();
  }

  // ✅ Convertir HTML en texte formaté simple (garde bold, italic, listes)
  private convertHtmlToFormattedText(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Fonction récursive pour convertir les nœuds
    const convertNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(element.childNodes).map(convertNode).join('');

        switch (tagName) {
          case 'strong':
          case 'b':
            return `<strong>${children}</strong>`;
          case 'em':
          case 'i':
            return `<em>${children}</em>`;
          case 'u':
            return `<u>${children}</u>`;
          case 'ul':
            return `<ul>${children}</ul>`;
          case 'ol':
            return `<ol>${children}</ol>`;
          case 'li':
            return `<li>${children}</li>`;
          case 'p':
          case 'div':
            return children ? `${children}<br>` : '<br>';
          case 'br':
            return '<br>';
          default:
            return children;
        }
      }

      return '';
    };

    return Array.from(tempDiv.childNodes).map(convertNode).join('');
  }

  // ✅ Insérer du texte à la position du curseur
  private insertTextAtCursor(text: string) {
    const element = this.textarea.nativeElement;
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;

      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Pas de sélection, ajouter à la fin
      element.innerHTML += text;
    }
  }

  // ✅ Mettre à jour prompt depuis le contenteditable (sans modifier le DOM)
  private updatePromptFromEditor() {
    if (!this.textarea?.nativeElement) return;

    const element = this.textarea.nativeElement as HTMLElement;
    // Extraire le texte brut (sans HTML) pour l'API
    const textContent = element.textContent?.trim() || '';
    this.prompt = textContent;
    // Garder le HTML pour l'affichage (sans forcer la mise à jour du DOM)
    this.promptHtml = element.innerHTML;

    // Gérer l'attribut data-empty pour le placeholder CSS
    // Vérifier plusieurs cas : vide, seulement <br>, seulement des espaces/retours à la ligne
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

  // ✅ Définir le prompt (texte brut) - remplace le contenu et place le curseur à la fin
  private setPrompt(text: string) {
    this.prompt = text;
    // Convertir le texte en HTML simple (garde les retours à la ligne)
    this.promptHtml = text.replace(/\n/g, '<br>');

    // Mettre à jour le contenteditable
    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;

      // Mettre à jour le contenu
      element.innerHTML = this.promptHtml;

      // Placer le curseur à la fin (comportement attendu lors d'une insertion programmatique)
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false); // Placer à la fin
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Mettre à jour l'attribut data-empty
      const isEmpty = !text.trim();
      element.setAttribute('data-empty', isEmpty.toString());
    }
  }

  // ✅ Vider le prompt
  private clearPrompt() {
    this.prompt = '';
    this.promptHtml = '';
    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;
      element.innerHTML = '';
      element.setAttribute('data-empty', 'true');
    }
  }

  // Help or
  onSelectSuggestion(suggestion: any) {
    // Garder le HTML de la suggestion pour l'affichage
    const html = suggestion.query||suggestion.prompt||suggestion.link;
    this.promptHtml = html;

    // Extraire le texte brut pour l'API
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    this.prompt = tempDiv.textContent?.trim() || '';

    // Mettre à jour le contenteditable
    if (this.textarea?.nativeElement) {
      const element = this.textarea.nativeElement as HTMLElement;
      element.innerHTML = html;
      // Mettre à jour l'attribut data-empty
      const isEmpty = !this.prompt;
      element.setAttribute('data-empty', isEmpty.toString());
    }

    this.suggestions = [];
    this.selectedSuggestionIndex = -1;

    //
    // Focus et placer le curseur à la fin du texte
    const element = this.textarea.nativeElement as HTMLElement;
    element.focus();
    const sel = window.getSelection();
    sel?.selectAllChildren(element);
    sel?.collapseToEnd();
  }

  //
  // Overlay : détecte quel item est survolé via la position Y
  onSuggestionsMouseMove(event: MouseEvent) {
    const overlay = event.currentTarget as HTMLElement;
    const menu = overlay.nextElementSibling as HTMLElement;
    const items = menu?.querySelectorAll('sl-menu-item');
    if (!items?.length) return;

    const y = event.clientY;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        this.selectedSuggestionIndex = i;
        return;
      }
    }
  }

  //
  // Overlay : sélectionne l'item survolé au clic
  onSuggestionsClick(event: MouseEvent) {
    if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < this.suggestions.length) {
      this.onSelectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
    }
  }

}
