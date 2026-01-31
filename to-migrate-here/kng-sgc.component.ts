  import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, ViewChild, inject, CUSTOM_ELEMENTS_SCHEMA, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KngAssistantAiService } from '../kng-assistant-ai.service';
import { KngPinnedService, PinnedDiscussion } from '../kng-pinned.service';
import { KngMemoriesService, DiscussionMemory, MemoryApplyMode, MemoryApplyModeLabels } from '../kng-memories.service';
import { AssistantState, Usage } from '../kng-model.assistant';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, isAdmin, isGuest, Me } from '../auth.service';
import { AppService, AppState } from '../app.service';
import { AppThemeComponent } from '../app.theme.component';
import { KngPromptComponent } from '../kng-prompt/kng-prompt.component';
import { KngAssistantHistoryComponent } from '../kng-history/kng-history.component';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'kng-sgc',
    templateUrl: './kng-sgc.component.html',
    styleUrls: ['./kng-sgc.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        AppThemeComponent,
        KngPromptComponent,
        KngAssistantHistoryComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngSgcComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly _destroying$ = new Subject<void>();
    private $auth = inject(AuthService);
    private $agents = inject(KngAssistantAiService);
    private $pinned = inject(KngPinnedService);
    private $memories = inject(KngMemoriesService);
    private $app = inject(AppService);
    private $route = inject(ActivatedRoute);
    private $router = inject(Router);

    @ViewChild('centerView') centerView!: ElementRef;
    @ViewChild('mobileWrapper', { read: ElementRef }) mobileWrapper?: ElementRef<HTMLElement>;

    /**
     * ✅ Host class binding for current route
     */
    @HostBinding('class')
    get hostClass(): string {
      return `route-${this.currentRoute}`;
    }

    isLoggedIn = false;
    user: any | undefined = undefined;
    me: Me | undefined = undefined;
    isAdmin = false;
    isGuest = false;
    isAssistantRuning = false;
    usage: Usage = { prompt: 0, completion: 0, total: 0, cost: 0 };
    memories: DiscussionMemory[] = [];
    pinnedDiscussions: PinnedDiscussion[] = [];
    agent = "SGC-capture";
    currentDescription = "";
    currentRoute = "";  // ✅ Store current route (sgc or edgar)

    welcome = "Edgar SGC";
    welcomeDescription = "L'assistant SGC de Pilet & Renaud SA";

    //
    // ✅ Autorecord mode - déclenche l'enregistrement audio automatiquement
    autoRecord = false;

    isEditMemoryDialogOpen = false;
    editingMemory: DiscussionMemory | null = null;
    editMemoryBody = '';
    editMemoryApplyMode: MemoryApplyMode = 'MEM_SMART';
    isEditMemorySaving = false;

    //
    // Labels pour le dropdown applyMode
    applyModeLabels = MemoryApplyModeLabels;
    applyModeOptions: MemoryApplyMode[] = ['MEM_ALWAYS', 'MEM_SMART', 'MEM_MANUAL'];

    /**
     * Retourne une icône emoji pour le mode d'application
     */
    getMemoryApplyModeIcon(memory: DiscussionMemory): string {
      switch (memory.applyMode) {
        case 'MEM_ALWAYS': return '🔒';
        case 'MEM_MANUAL': return '✋';
        case 'MEM_SMART':
        default: return '✨';
      }
    }

    state: AppState = {
      state: 'assistant',
      view: 'assistant'
    }

    get isSGC() {
      return this.currentRoute === 'sgc';
    }

    ngOnInit(): void {
      // ✅ Detect current route and configure component accordingly
      this.currentRoute = this.$route.snapshot.routeConfig?.path || '';
      this.configureForRoute(this.currentRoute);

      //
      // ✅ Detect and consume autorecord query param (ex: /agent/edgar?autorecord)
      this.autoRecord = this.consumeQueryParam('autorecord');

      // ✅ Load preloaded data from resolver
      const loaderData = this.$route.snapshot.data['loader'];
      if (loaderData) {
        this.isAdmin = isAdmin(loaderData.me);
        this.isGuest = isGuest(loaderData.me);
        // Initialiser avec les données préchargées
        this.isLoggedIn = loaderData.auth?.isAuthenticated || false;
        this.user = loaderData.auth?.account;
        this.me = loaderData.me;
        this.memories = loaderData.memories || [];
        this.pinnedDiscussions = loaderData.pinned || [];
        this.usage = loaderData.history?.usage || this.usage;
      }

      this.$app.state$.pipe(
        takeUntil(this._destroying$)
      ).subscribe(async state => {
        this.state = state;
      });

      // ✅ Subscribe to auth state changes (for logout, etc.)
      this.$auth.user$.pipe(
          takeUntil(this._destroying$)
      ).subscribe(state => {
          this.isLoggedIn = state.isAuthenticated;
          this.user = state.account;
      });

      // ✅ Subscribe to observables for real-time updates
      this.subscribeToUpdates();
    }

    ngAfterViewInit(): void {
      // Positionner le scroll initial sur la colonne center sur mobile
      // Utiliser setTimeout pour s'assurer que le DOM est complètement rendu
      setTimeout(() => {
        this.$app.scrollToCenter(this.mobileWrapper?.nativeElement);
      }, 100);
    }

    ngOnDestroy(): void {
        this._destroying$.next(undefined);
        this._destroying$.complete();
    }

    login(): void {
        this.$auth.login();
    }

    async logout() {
        this.$auth.logout();
    }

    /**
     * ✅ Subscribe to observables for real-time updates
     * Les données sont déjà chargées par le resolver, on écoute juste les changements
     */
    private subscribeToUpdates() {
        // ✅ Subscribe to memories updates (nouveau service)
        this.$memories.memories$.pipe(
            takeUntil(this._destroying$)
        ).subscribe((memories: DiscussionMemory[]) => {
            this.memories = memories;
        });

        // ✅ Subscribe to pinned discussions updates
        this.$pinned.pinned$.pipe(
            takeUntil(this._destroying$)
        ).subscribe((pinned: PinnedDiscussion[]) => {
            this.pinnedDiscussions = pinned;
        });

        // ✅ Subscribe to assistant state updates
        this.$agents.state$
            .pipe(
                takeUntil(this._destroying$),
                // ✅ Filter states by agent
                filter(state => !this.agent || state.agent == this.agent)
            )
            .subscribe(async(state: AssistantState) => {
                this.usage = state.usage || this.usage;
                this.isAssistantRuning = !!(state.status && state.status == 'running');
            });
    }

    /**
     * ✅ Mémorise la discussion active
     */
    async memorizeDiscussion() {
        await this.$memories.memorize(this.agent).toPromise();
    }

    /**
     * ✅ Supprime une mémoire de discussion
     */
    async deleteMemory(id: string) {
        await this.$memories.delete(id).toPromise();
    }

    openEditMemoryDialog(memory: DiscussionMemory) {
      this.editingMemory = memory;
      //
      // Prefer raw markdown/text (kept by KngMemoriesService). Fallback to empty string.
      this.editMemoryBody = (memory.summaryRaw ?? '').toString();
      this.editMemoryApplyMode = memory.applyMode || 'MEM_SMART';
      this.isEditMemoryDialogOpen = true;
    }

    closeEditMemoryDialog() {
      this.isEditMemoryDialogOpen = false;
      this.editingMemory = null;
      this.editMemoryBody = '';
      this.editMemoryApplyMode = 'MEM_SMART';
      this.isEditMemorySaving = false;
    }

    onEditMemoryBodyInput($event: Event) {
      this.editMemoryBody = (($event.target as any)?.value ?? '').toString();
    }

    onEditMemoryApplyModeChange($event: Event) {
      const value = ($event.target as any)?.value;
      if (value && this.applyModeOptions.includes(value)) {
        this.editMemoryApplyMode = value;
      }
    }

    async saveEditedMemory() {
      if (!this.editingMemory || this.isEditMemorySaving) {
        return;
      }
      const body = this.editMemoryBody.trim();
      if (!body) {
        return;
      }

      try {
        this.isEditMemorySaving = true;
        //
        // Envoyer le applyMode uniquement s'il a changé
        const applyModeChanged = this.editMemoryApplyMode !== (this.editingMemory.applyMode || 'MEM_SMART');
        const applyMode = applyModeChanged ? this.editMemoryApplyMode : undefined;
        await this.$memories.update(this.editingMemory.id, body, applyMode).toPromise();
        this.closeEditMemoryDialog();
      } finally {
        this.isEditMemorySaving = false;
      }
    }

    async ask(query: any) {
      const prompt = query.question || query.content;
      // clear history
      await this.$agents.history(true, this.agent).toPromise();
      const prefix = (query.category&&!this.isSGC) ? ' ' : '';
      this.$app.scrollToCenter(this.mobileWrapper?.nativeElement);
      await this.$agents.chat(prefix + prompt, {runAgent: this.agent}).toPromise();

    }


    get categories() {
        return Object.keys(this.$agents.queries);
    }

    getQuestions(category: string) {
      return this.$agents.queries[category] || [];
    }

    getSGC() {
      return this.$agents.sgc;
    }

    /**
     * ✅ Load a pinned discussion (preserves ID)
     */
    async loadPinned(pin: PinnedDiscussion) {
      await this.$pinned.load(pin.id).toPromise();
      // Recharger l'historique pour afficher la discussion chargée
      await this.$agents.history(false, this.agent).toPromise();
      this.$app.scrollToCenter(this.mobileWrapper?.nativeElement);

    }

    /**
     * ✅ Fork a pinned discussion (new ID)
     */
    async forkPinned(pin: PinnedDiscussion) {
      await this.$pinned.fork(pin.id).toPromise();
      // Recharger l'historique pour afficher la discussion forkée
      await this.$agents.history(false, this.agent).toPromise();
      this.$app.scrollToCenter(this.mobileWrapper?.nativeElement);

    }

    /**
     * ✅ Delete a pinned discussion
     */
    async deletePinned(pin: PinnedDiscussion) {
      await this.$pinned.unpin(pin.id, this.agent).toPromise();
    }

    /**
     * ✅ Configure component based on current route
     */
    private configureForRoute(route: string): void {
      if (route === 'edgar') {
        this.agent = 'PR-knowledge';  // Use default agent for Edgar
        this.welcome = 'Edgar';
        this.welcomeDescription = "L'assistant IA de Pilet & Renaud SA";
      } else if (route === 'sgc') {
        this.agent = 'SGC-capture';  // Use SGC specific agent
        this.welcome = 'Edgar SGC';
        this.welcomeDescription = "L'assistant SGC de Pilet & Renaud SA";
      }
    }

    /**
     * ✅ Consomme un query param et le supprime de l'URL
     * Retourne true si le param était présent, false sinon
     */
    private consumeQueryParam(param: string): boolean {
      const queryParams = this.$route.snapshot.queryParams;
      const hasParam = queryParams[param] !== undefined;

      if (hasParam) {
        //
        // Supprimer le param de l'URL sans recharger la page
        const { [param]: _, ...remainingParams } = queryParams;
        this.$router.navigate([], {
          relativeTo: this.$route,
          queryParams: remainingParams,
          replaceUrl: true
        });
      }

      return hasParam;
    }

}
