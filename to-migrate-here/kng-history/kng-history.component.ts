import { Component, ElementRef, HostListener, Input, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientDiscussion, AssistantStep } from '../kng-model.assistant';
import { KngAssistantAiService } from '../kng-assistant-ai.service';
import { KngPinnedService } from '../kng-pinned.service';
import { KngMemoriesService } from '../kng-memories.service';
import { ActivatedRoute, Router } from '@angular/router';
import markdownit from 'markdown-it'
import { toSlug } from '../kng-rules/kng-rules.service';
import { AssetViewerComponent } from '../kng-assets/asset-viewer.component';
import { AssetService } from '../kng-assets/asset.service';
import { filter } from 'rxjs/operators';
import { KngRagService } from '../kng-rag/kng-rag.service';
import { isGuest } from '../auth.service';

@Component({
    selector: 'kng-assistant-history',
    templateUrl: './kng-history.component.html',
    styleUrls: ['./kng-history.component.scss'],
    standalone: true,
    imports: [CommonModule, AssetViewerComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngAssistantHistoryComponent implements OnDestroy {

  @Input() onlyLast:boolean = false;
  @Input() target: string |'user'|'CoT'|'steps' = 'assistant';
  @Input() withHeader:boolean = false;

  welcome = "Edgar";
  welcomeDescription = "L'assistant de Pilet & Renaud SA";

  // ✅ Agent management
  @Input() agent: string = 'current';

  linksByAgent = {
    'PR-knowledge': [
        // { name: 'Quelles procédures tu connais ?',action: "/list" },
        { name: 'Qui es-tu ?',action: "Edgar, présente toi et listes toutes tes fonctions avec un cs de l'aide" },
        { name: 'Qui suis-je ?',action: "Qui suis-je ?" },
        { name: 'Mon daily!',action: "/daily" },
        { name: 'Aide',action: "/help" },
      ],
    'SGC-capture': [
      { name: 'Qui suis-je ?',action: "Qui suis-je ? (référence: 900000.048 003.14" },
      { name: 'Aide',action: "/help" },
    ]

  }
  markdown:any;

  // ✅ StateGraph-only format
  discussionMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date, steps?: AssistantStep[]}> = [];

  displayChatActions:boolean = false;
  isAssistantRuning:boolean = false;
  showSteps:boolean = false;
  openAsset: { url: string; text: string } | null = null;
  isDiscussionMemorized: boolean = false;
  currentDiscussionId: string | null = null;
  isGuest = false;
  //
  // Action running state (for feedback, pin, memorize)
  isActionRunning = signal<boolean>(false);

  private $pinned = inject(KngPinnedService);
  private $memories = inject(KngMemoriesService);
  private $assets = inject(AssetService);

  constructor(
    private $agents: KngAssistantAiService,
    private $ef: ElementRef,
    private $router: Router,
    private $route: ActivatedRoute,
    private $rag: KngRagService
  ) {
    this.markdown = markdownit({
      html: true,
      linkify: true,
      typographer: true
    });
  }


  get links(){
    return this.linksByAgent[this.agent] || [];
  }

  get lastMessage(){
    if(this.discussionMessages.length === 0) {
      return {steps:[], id: '', content: '', role: 'assistant' as const, timestamp: new Date()};
    }
    const last = this.discussionMessages[this.discussionMessages.length - 1];
    return {
      ...last,
      steps: last.steps || []
    };
  }

  ngOnInit(): void {
    // ✅ Use state$ ONLY for assistant running status
    this.#scrollToTop();


    const loaderData = this.$route.snapshot.data['loader'];
    if (loaderData) {
      this.isGuest = isGuest(loaderData.me);
    }


    this.$rag.ragList$.pipe(filter(ragList => ragList !== null)).subscribe(ragList => {
      console.log('ragList',ragList);
    });


    this.$agents.state$.pipe(filter(state => !this.agent || state.agent === this.agent))
      .subscribe(state => {
        this.isAssistantRuning = (state?.status === 'running');

        if(state.steps?.length && this.discussionMessages.length > 0){
          const lastIndex = this.discussionMessages.length - 1;
          this.discussionMessages[lastIndex].steps = state.steps;
        }

        // ✅ Sync history after completion
        if(state?.status === 'end'){
          this.$agents.history(false, this.agent).toPromise().then();
        }
        this.#scrollToBottom();
      });

    this.$agents.history(false, this.agent).toPromise().then();
      // ✅ Use discussion$ for all message management (service handles temp messages)
    this.$agents.discussion$.pipe(filter(discussion => !this.agent || discussion.agent === this.agent))
      .subscribe(discussion => {
      if(!discussion.id){
        this.currentDiscussionId = null;
        this.isDiscussionMemorized = false;
        return;
      }
      this.discussionMessages = discussion.messages;
      this.currentDiscussionId = discussion.id;
      this.#scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    // ✅ Clean up scroll timeout to prevent memory leaks
    if (this.debounceScroll) {
      clearTimeout(this.debounceScroll);
    }
  }

  #scrollToTop() {
    if (this.$ef) {
      // Scroll to the top of the document
      setTimeout(() => {
        this.$ef.nativeElement.scrollTop = 0;
      }, 100); // Small delay to ensure content is rendered
    }
  }

    private debounceScroll: any = null;

  #scrollToBottom() {
    const element = this.$ef?.nativeElement;

    // ✅ Debounce: Cancel previous scroll if new one is requested
    if (this.debounceScroll||!element) {
      return;
    }

    this.debounceScroll = setTimeout(() => {
      this.debounceScroll = null;
      const isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 400;
      // console.log('scroll test', isNearBottom, element.scrollTop, element.clientHeight, element.scrollHeight);
      // ✅ Only auto-scroll if user is near bottom (not manually scrolled up)
      if (!isNearBottom) {
        return;
      }
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }, 600);
  }

  renderStep(json:any){
    try{
      // const jsonraw = step.replace(/<\/?step>/gm,'');
      // if(!jsonraw){
      //   return '';
      // }
      // const json = JSON.parse(jsonraw);
      return json.description||json.content;
    }
    catch(e){
      return '';
    }
  }

  renderMarkdown(message:string|undefined){
    if(!message){
      return '';
    }
    return this.markdown.render(message.trim());
  }

  async onAudioChat(audio:any){
    const transcription = await this.$agents.whisper(audio);
    console.log('-------onAudioChat',transcription);
  }

  async onChat(message: any){
    // ✅ NEW: Use event system with component agent
    this.$agents.sendPrompt(message.content, this.agent);
  }

  async onAsk(text:string){
    await this.$agents.chat(text, {runAgent: this.agent}).toPromise();
  }

  async onCopyWithHtml(id: string, $event: any) {
    const target = document.getElementById(`msg-${id}`);

    if(!target) {
      return;
    }
    const formattedHtml = target.innerHTML;
    const plainText = target.innerText;

    // L'API Navigator.clipboard.write() vous permet de copier différents types de contenus
    const item = new ClipboardItem({
      'text/html': new Blob([formattedHtml], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
    });

    try {
      await navigator.clipboard.write([item]);
    } catch (error) {
      console.error('Erreur lors de la copie du contenu : ', error);
    }

    // Empêche le copier automatique "par défaut" de Shoelace
    $event.preventDefault();
  }



  @HostListener('click', ['$event'])
  async onMarkdownClick($event) {
    const target = $event.target as HTMLElement;
    const href = target.getAttribute('href')||'';
    const text = target.innerText;
    console.log('click a:',href);
    console.log('click b:',target.innerText);

    if(!href) {
      return;
    }
    $event.stopPropagation();
    $event.preventDefault();


    const isExternalLink = ['mailto:','tel:','https://','ftp://'].some(prefix => href.indexOf(prefix)==0);
    if(isExternalLink){
      window.open(href, '_blank');
      return;
    }

    //
    // Handle asset download links
    // - href => /api/assets/:slug/download
    if(href.includes('/assets/') && href.endsWith('/download')) {
      await this.downloadAsset(href, text);
      return;
    }

    //
    // Handle asset links (in-app) - display in dialog
    // - href => /api/assets/:slug/stream
    if(href.startsWith('/assets/')) {
      this.openAsset = { url: href, text };
      console.log('openAsset',this.openAsset);
      // const isAudio = text.includes('🎵') || text.toLowerCase().includes('écouter');
      // if(isAudio) {
      //   // Audio: play inline
      //   this.playAudioAttachment(href, text, $event);
      // } else {
      //   // Display asset in dialog
      //   this.openAsset = { url: href, text };
      // }
      return;
    }

    if(href.indexOf('#section')>-1){
      // replace first char '/' by ''
      // Le paramètre /:slug s'arrête au premier point, donc il ne capture que la première partie du slug.
      // Il faut donc remplacer le premier '/' par '' pour avoir le slug complet.
      const cleanedHref = decodeURI(href).replace(/^\//,'').replace(/#section.*$/,'').replace(/\.md$/,'');
      const url = toSlug(cleanedHref);
      this.$router.navigate(['/rules',url],{queryParams:{status:'editing',from:'edgar',branch:'rule-editor'}});
      return;
    }
    //const name=(target.innerText);
    // const prompt = `Tu dois afficher la procédure [${text}](${href}).`;
    // await this.$agents.chat(prompt).toPromise();
    //


  }

  //
  // Download asset handler
  // - href => /api/assets/:slug/download
  // - Downloads the file with proper filename
  private async downloadAsset(href: string, fallbackFilename: string): Promise<void> {
    try {
      //
      // Normalize URL (remove /api/ prefix if present)
      const restUrl = href.replace(/^\/?api\//, '');

      //
      // Fetch blob and metadata
      const { blob, meta } = await this.$assets.streamAsset(restUrl);

      //
      // Create temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = meta.filename || fallbackFilename || 'download';

      //
      // Trigger download
      document.body.appendChild(link);
      link.click();

      //
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading asset:', error);
      //
      // Fallback: open in new tab
      window.open(href, '_blank');
    }
  }

  private playAudioAttachment(href: string, text: string, event: Event) {
    // Remove any existing audio players
    const existingPlayer = document.getElementById('attachment-audio-player');
    if(existingPlayer) {
      existingPlayer.remove();
    }

    // Create audio element
    const audio = document.createElement('audio');
    audio.id = 'attachment-audio-player';
    audio.controls = true;
    audio.autoplay = true;
    audio.src = href;
    audio.style.maxWidth = '100%';
    audio.style.marginTop = '10px';

    // Add error handling
    audio.onerror = () => {
      console.error('Erreur lors du chargement du fichier audio');
      alert('Impossible de lire le fichier audio. Vérifiez votre connexion.');
    };

    // Find the message container and append the audio player
    const messageContainer = (event.target as HTMLElement).closest('.message-content') ||
                             (event.target as HTMLElement).closest('[id^="msg-"]') ||
                             document.body;

    messageContainer.appendChild(audio);

  }


  async onHistoryDel(msg: any){
    await this.$agents.historyDel(msg.id, this.agent).toPromise();
  }

  async onFeedback(message: any, feedback:string){
    if (this.isActionRunning()) return;
    this.isActionRunning.set(true);
    try {
      console.log('onFeedback',message,feedback);
      const prompt = `Tu dois envoyer un feedback (${feedback}) avec un résumé de la conversation.`;
      await this.$agents.chat(prompt, {runAgent: this.agent}).toPromise();
    } finally {
      this.isActionRunning.set(false);
    }
  }

  /**
   * ✅ Épingle la discussion active
   */
  async onPin() {
    if (this.isActionRunning()) return;
    this.isActionRunning.set(true);
    try {
      await this.$pinned.pin(this.agent).toPromise();
    } finally {
      this.isActionRunning.set(false);
    }
  }

  /**
   * ✅ Mémorise la discussion active
   * La vérification si déjà mémorisée est faite côté serveur
   */
  async onMemorize() {
    if (!this.currentDiscussionId || this.isDiscussionMemorized || this.isActionRunning()) {
      return;
    }

    this.isActionRunning.set(true);
    try {
      //
      // Mémoriser la discussion (le serveur vérifie automatiquement si déjà mémorisée)
      const result = await this.$memories.memorize(this.agent).toPromise();

      //
      // Mettre à jour le statut si succès ou si déjà mémorisée (409)
      if (result && !result.error) {
        this.isDiscussionMemorized = true;
      } else if (result?.error === 'Discussion already memorized') {
        // Déjà mémorisée (erreur 409 retournée par le serveur)
        this.isDiscussionMemorized = true;
      }
    } catch (error: any) {
      // Gérer l'erreur 409 (déjà mémorisée)
      if (error?.status === 409) {
        this.isDiscussionMemorized = true;
      }
    } finally {
      this.isActionRunning.set(false);
    }
  }

  onMail(message: any){
    console.log('onMail',message);
  }

}
