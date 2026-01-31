import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject, firstValueFrom, Observable, of, Subject} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AssistantState, AssistantStep, Usage, ClientDiscussion } from './kng-model.assistant';
import { MSAL_INTERCEPTOR_CONFIG, MsalInterceptorConfiguration, MsalService } from '@azure/msal-angular';
// For your markdown library import
// import * as MarkdownIt from 'markdown-it';

/**
 * ✅ Extract steps from a message content
 */
export function parseSteps(message: string): AssistantStep[] {
  if (!message) return [];
  const jsonraw = message.match(/<step>([\s\S]*?)<\/step>/gm)?.map(step => step.replace(/<\/?step>/g, '')) || [];
  return jsonraw?.map(step => {
    try {
      const parsed = JSON.parse(step);
      // Ensure description field exists
      return { description: parsed.description || step, ...parsed };
    } catch (e) {
      return { description: step };
    }
  }) || [];
}

@Injectable({
  providedIn: 'root'
})
export class KngAssistantAiService {
  private defaultUsage: Usage = {prompt: 0, completion: 0, cost: 0, total: 0};
  private defaultState: AssistantState = { status: 'init', usage: this.defaultUsage};

  // ✅ StateGraph-only BehaviorSubject
  private discussionSubject = new BehaviorSubject<ClientDiscussion>({
    id: null,
    messages: [],
    usage: this.defaultUsage,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  private stateSubject = new BehaviorSubject<AssistantState>(this.defaultState);
  private transcriptionsSubject = new BehaviorSubject<string>('');
  private memoriesSubject = new BehaviorSubject<any[]>([]);  // ✅ NEW: Memories state

  // ✅ NEW: Event system for prompt cross-component communication
  private promptEventSubject = new Subject<string>();

  // ✅ StateGraph-only observables
  discussion$ = this.discussionSubject.asObservable();
  state$ = this.stateSubject.asObservable();
  transcriptions$ = this.transcriptionsSubject.asObservable();
  memories$ = this.memoriesSubject.asObservable();  // ✅ NEW: Observable for memories
  promptEvt$ = this.promptEventSubject.asObservable();

  questions = {
    'MFiles': [
      {
        "question": "Est-ce que Jean BURRI est à jour avec son loyer ?"
      },
      {
        "question": "Est-ce que 1353.045 001.10 a payé son dernier loyer ?"
      },
      {
        "question": "Quelle est le montant de sureté pour le locataire 1217.046 004.10"
      },
    ],
    "Admin": [
      {
        "question": "Quelle est la procédure pour la résiliation de mon bail ?"
      },
      {
        "question": "Qu'est-ce que je dois faire pour résilier mon bail ?"
      },
      {
        "question": "Comment créer une QR-facture pour payer un loyer ?",
        "note": "Les procédures ont pas été mis à jour avec l'introduction de la QR facture. Il faut demander une recherche sur internet."
      },
      {
        "question": "C'est quoi une RC et comment se la procurer ?",
        "note": "Aucune procédure n'existe pour la RC. Il faut demander une recherche sur internet."
      },
      {
        "question": "C'est quoi une GB et comment se la procurer ?",
        "note": "GB: Garantie bancaire"
      },
      {
        "question": "Quelle est la procédure à suivre en cas de décès ? (locataire ou collaborateur)"
      },
      {
        "question": "Comment je peux traiter une plainte de voisinage ?",
        "note": "Aucune procédure n'existe. Il faut demander une recherche sur internet."
      },
      {
        "question": "Comment je peux justifier qu'un locataire fait de la sous-location ?",
        "note": "⚠️ Plusieurs procédures existent."
      },
      {
        "question": "Jusqu'à quelle date puis-je payer mon loyer ?"
      },
      {
        "question": "Où en est ma candidature / mon dossier d'inscription auprès de la FVGLS ?",
        "note": "Aucune procédure pour ce sujet. Il faut demander une recherche sur internet."

      },
      {
        "question": "Où en est ma candidature / mon dossier d'inscription ?",
        "note": "⚠️ La formulation créé de la confusion. 'je cherche la procédure des dossiers d'inscription' "
      },
      {
        "question": "Quel type de bail dois-je établir pour tel objet ?"
      },
      {
        "question": "Comment fixer correctement un loyer ? (loyer, charges, FA, type de bail, etc.)"
      },
      {
        "question": "Comment savoir si un candidat est solvable ? (Règle : le loyer ne doit pas dépasser un tiers des revenus)",
        "note": "Aucune procédure pour ce sujet"
      }
    ],
    "Tech": [
      {
        "question": "J'ai perdu mes clés, que dois-je faire et combien cela va me coûter ?"
      },
      {
        "question": "Un bon a-t-il déjà été fait pour tel objet et pour ce corps de métier X ? Que demandait-il ?"
      },
      {
        "question": "Quand les peintures (ou parquet, ou plafond, etc.) ont-elles été refaites pour l'objet X ?"
      },
      {
        "question": "Quelle est la procédure pour traiter un problème de punaises de lit ?"
      },
      {
        "question": "Lorsque je reçois un appel en cas de fuite, qu'elles sont les questions à poser à l'appelant qui sont induites par les réponses qu'ils donnent afin de définir quel corps de métier envoyé ?",
        "note": "demandé plus de détails si nécessaire"
      },
      {
        "question": "Y a-t-il une franchise pour tel dégât dans tel appartement ? Si oui, quel est son montant ? Le dégât est-il couvert par l'assurance ?",
        "note": "accès étendu à M-Files"
      },
      {
        "question": "Peux-tu vérifier s'il y a des réserves à la sortie de ce locataire ? (bons effectués, factures, refacturation, paiement, libération de la GB)"
      }
    ],
    "RH": [
      {
        "question": "Quel est le solde de mes vacances ?",
        "note": "L'assistant n'a pas accès aux données RH personnelles"
      },
      {
        "question": "Quels sont les ponts offerts cette année ?",
        "note": "L'assistant n'a pas accès aux données"
      },
      {
        "question": "Peux-tu me dire si tel collaborateur est présent à la régie, en déplacement ou en vacances ?",
        "note": "L'assistant n'a pas ENCORE accès a ces données"
      },
      {
        "question": "Peux-tu me donner le numéro interne de tel collaborateur ? (ou son mail, son étage, ses initiales)",
        "note": "L'assistant n'a pas ENCORE accès a ces données"
      },
      {
        "question": "Quel groupe gère tel immeuble ? (Quel gérant technique, comptable, gérant polyvalent, administratif ou répondant contentieux ?)",
        "note": "L'assistant n'a pas ENCORE accès a ces données"
      },
      {
        "question": "J'ai un souci avec Quorum, qui peut m'aider ? Idem pour M-Files, les imprimantes, ou l'IA PRSA ?",
        "note": "Il faut détailler la demande"
      },
      {
        "question": "Comment puis-je régler l'imprimante ?",
        "note": "L'assistant n'a pas ENCORE accès a ces données"
      }
    ]
  }

  sgc = [
    {category: "S1", question: "Je souhaite connaitre la liste de nos immeubles proche de la rue du Stand."},
    {category: "S1", question: "Tu dois consulter la FAO pour avoir la liste des noms des débiteurs."},
    {category: "S1", question: "Tu dois consulter la FAO pour avoir la liste 'APA' et pour chaque adresse tu cherches nos immeubles ."},

    {category: "S1", question: "Bonjour, je suis Emilie Meïer (référence: '900000.048 003.14'). Je veux savoir si j'ai des interventions en cours (bon de travail), et j'ai aussi besoin de mon contrat de Bail" },
    {category: "S1", question: "Bonjour, je suis Zehra TASKIN (référence: '9773.043 004.12'). Je veux voir mon profile, ma mémoire, mes documents (contrat, tickets, etc.), en une liste avec des liens"},
    // Test 1: Bon fuite d'eau - SUCCESS ✅
    {category: "create-bon", question: "Bonjour, je suis Yassin Mahammed (référence: '0153.040 001.12'), locataire au 20 chemin de Chapelly (Appartement, 1er étage). Mon lavabo de salle de bain est bouché: l'eau s'évacue très lentement et remonte."},
    // Test 1: Bon Serrurerie - SUCCESS ✅
    {category: "create-bon", question: "Bonjour je suis Rafaela Soares de Sousa (référence: '9033.047 003.14'), locataire au 90 rue des Eaux-Vives (3ème étage). Je souhaite commander de nouvelles clés."},

    // Test 2: Bon Clé+Plaquette - ÉCHEC (promesse contact) ❌
    {category: "create-bon", question: "Bonjour, je suis Nikolaos Mavrakanas, locataire au '349.041 001.10' (Bureaux, 1er étage). Je souhaite commander une clé supplémentaire pour une nouvelle employée et faire ajouter une plaquette BAL au nom du Dr Raphaël Wuarin."},

    // Test 3: Bon Menuiserie - SUCCESS ✅
    {category: "create-bon", question: "Bonjour, je suis Sébastien Dubois (référence: '1001.042 001.08'), locataire au 16 rue du Stand (Appartement, 1er étage). Je signale qu'une porte de meuble de cuisine ne tient plus: le bois est abîmé, les vis tombent. J'ai tenté de revisser mais le bois ne tient plus le poids. Je souhaite une intervention la semaine prochaine."},

    // Test 4: Bon Électricien - SUCCESS ✅
    {category: "create-bon", question: "Bonjour, je suis Beat Schmid (référence: '0281.031 013.12'), locataire au 28 avenue de Champel (Appartement, 13ème étage). Je signale qu'un store extérieur du salon fait disjoncter tout l'appartement quand je l'abaisse. Je souhaite qu'une entreprise intervienne pour remettre le store en bon fonctionnement."},

    // Test 5: Bon Électroménager - ÉCHEC (conversation continue) ❌
    {category: "create-bon", question: "Bonjour, je suis Ines Martin Garcia (référence: '9806.040 002.12'), locataire au 98 route de Frontenex (Appartement, 2ème étage). Je demande quand la seule machine à laver de l'immeuble sera réparée et si la régie peut accélérer auprès de Lavorent, car on nous annonce au moins fin de semaine."},

    // Test 8: Transfer Double Charge - ÉCHEC (limite échanges) ⚠️
    {category: "transfer-l2", question: "Bonjour, je suis Estrella Merlos Castaneda (référence: '0163.031 012.16'), locataire parking intérieur 12 au 6 rue Cramer (1er sous-sol). Je constate un double débit pour le parking (200 CHF hier et 200 CHF aujourd'hui). Merci d'annuler l'un des deux au plus vite."},

    // Test 9: Transfer Échéance Paiement - ÉCHEC (promesse "nous vous contacterons") ❌
    {category: "transfer-l2", question: "Bonjour, je suis Mickaël Audrain (référence: '330.420 004.12'), locataire au 42 rue Caroline (Appartement, 2ème étage). Je vous transmets mon IBAN pour enregistrement et je souhaite savoir à quelle date précise vous souhaitez que je règle le loyer chaque mois (ex. le 2 ou 3 avril)."},

    // Test 10: Transfer Multi-sujets - ÉCHEC (promesse "gestionnaire vous recontactera") ❌
    {category: "transfer-l2", question: "Bonjour, je suis Ana Barciela Villar (référence: 994.150 074.10), locataire au 12 chemin de Maisonneuve (Appartement, 7ème étage). Je conteste une facture de réparation du four alors que l'électroménager devrait être sous garantie 2 ans. Je demande le numéro du bureau d'architecte pour avancer sur le problème de chauffage non résolu depuis le 20 décembre. Je signale qu'il n'y a plus d'eau chaude (seulement tiède) et je demande le contact de la personne en charge. Je souhaite aussi savoir quand les travaux de l'étage seront terminés (câbles pendants, luminaires manquants)."},

    // Test 11: Transfer Urgence Plomberie - ÉCHEC (promesse bon de travail pour fuite multi-étages) ❌
    {category: "transfer-l2", question: "Bonjour, je suis Yassin Mahammed (référence: 0153.040 001.12), locataire au 20 chemin de Chapelly (Appartement, 1er étage). Je signale des fuites et de l'humidité au plafond d'une chambre et de la salle de douche; la peinture se décolle. J'ai des photos. Nouvelle fuite hier; je confirme des dégâts constatés déjà l'an dernier. Le technicien dit que c'est un tube de chauffage qui fuit, avec risque de dégâts, et a informé P&R. Pouvez-vous faire passer un chauffagiste aujourd'hui? Le locataire de l'étage supérieur ne répond pas. Depuis le week-end, la fuite s'aggrave. Nous ne pouvons plus utiliser la chambre, les enfants dorment au salon."},

    // Test 12: Bon Plomberie/Sanitaire - ÉCHEC (création directe bon de travail interdite) ❌
    {category: "transfer-l2", question: "Bonjour, je suis Beat Schmid (référence: '0281.031 013.12'), locataire au 28 avenue de Champel (Appartement, 13ème étage). Je signale pas d'eau chaude dans la salle de bains et des nuisances liées à des machines à laver chez des voisins. Le problème d'eau chaude survient surtout le week-end quand des voisins utilisent des machines à laver, j'évoque aussi des bruits nocturnes récurrents (douches/WC) d'un voisin identifié, une douche bouchée et des fuites évier cuisine."},

    // Test 13: Transfer Arrangement - ÉCHEC (promesse "je transfère immédiatement") ❌
    {category: "transfer-l2", question: "Bonjour, je suis Linono Mbwanga, représentant de Mme Clot-Ayouche Dounia (référence: 991.231 000.062.02). Je demande un arrangement pour régler CHF 1'710.- (loyer/frais de retard) pour Mme CLOT-AYOUCHE, à CHF 100.-/mois car elle est au minimum vital. Je confirme un versement de CHF 500.- pour réduire la dette et je sollicite un arrangement à CHF 150.-/mois dès août."},

    // Test 14: Transfer Contestation - SUCCESS ✅
    {category: "transfer-l2", question: "Bonjour, je suis Nadir Akbarov (référence: 294.460 002.10), locataire au 60F route de Frontenex (Appartement, 6ème étage). Je conteste vos calculs: le total des dégâts est 3'622.38 CHF, l'assurance a déjà payé 2'350 CHF, il me reste 1'272.38 CHF. Avec ma franchise chauffage 316.75 CHF à déduire et un demi-loyer 851.50 CHF, je dois payer 1'807.13 CHF. Je refuse des frais de rappel 30 CHF et je suis très insatisfait."},

    // Test 15: Demande Interne - ÉCHEC (mention délai "aujourd'hui") ❌
    {category: "internal-request", question: "Bonjour, je suis Stéphanie Marki-Binggeli, Pilet Renaud SA. Je demande qu'on prépare 6 clés d'accès du parking supérieur de François-Ruchon 3 et qu'on les envoie d'urgence à la concierge; s'il n'y en a plus assez, il y en a dans la boîte à droite de mon bureau. Est-ce que nous les envoyons à Mme Pereira Dias Martins Alcina à la rue de Lyon 67bis ? Je confirme le destinataire, et je demande si quelqu'un peut le faire aujourd'hui (idéalement pas demain)."}
  ];

  constructor(
    private $http:HttpClient,
    @Inject(MSAL_INTERCEPTOR_CONFIG)
    private msalInterceptorConfig: MsalInterceptorConfiguration

  ) {}

  // ✅ StateGraph-only getters
  get discussion(): ClientDiscussion {
    return this.discussionSubject.value;
  }

  get discussionMessages(): Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> {
    return this.discussion.messages;
  }

  get state(): AssistantState {
    return this.stateSubject.value;
  }

  get queries() {
    return this.questions;
  }

  private cleanText(text:string) {
    return text.replace(/<thinking>[\s\S]*?<\/thinking>/g,'').replace(/^<step.*$/gm,'').replace(/<memories>[\s\S]*?<\/memories>/g, '');
  }

  updateState(partial: Partial<AssistantState>) {
    this.stateSubject.next({
      ...this.state,
      ...partial
    });
  }


  // ✅ NEW: Cross-component prompt communication + chat trigger
  sendPrompt(prompt: string, agent?: string, ragname?: string) {
    this.promptEventSubject.next(prompt);
    return this.chat(prompt, {runAgent: agent, ragname});
  }

  emails() {
    const headers = {
      'Content-Type': 'application/json',
      'ngsw-bypass': 'true',
      'Cache-Control': 'no-cache',
    };
    return this.$http.get('/api/emails', {
      withCredentials: true,
      headers
    });
  }

  historyDel(messageId: string, agent?: string) {
    const discussion = this.discussionSubject.value;
    if(!messageId) {
      return of(discussion);
    }

    // ✅ Use new URL structure with agent parameter
    const agentParam = agent || 'current';
    return this.$http.post(`/api/agent/${agentParam}/history/none/${messageId}`, {}, {
      withCredentials: true,
      headers: {
        'ngsw-bypass': 'true',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      }
    }).pipe(
      tap((res: any) => {
        // Update discussion with server response
        this.discussionSubject.next(res);
      }),
      catchError((error) => {
        const message = error.error?.message || 'Erreur lors de la suppression de l\'historique';
        this.notify(message, 'danger', 'exclamation-triangle');
        return of(error);
      })
    );
  }

  memories() {
    return this.$http.get('/api/agent/memories', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'ngsw-bypass': 'true',
        'Cache-Control': 'no-cache',
      }
    }).pipe(
      tap((memories: any) => {
        // ✅ Update memories$ observable
        this.memoriesSubject.next(memories);
      })
    );
  }

  memoryDel(id: string): Observable<any> {
    return this.$http.delete(`/api/agent/memories/${id}`, {
      withCredentials: true,
      headers: {
        'ngsw-bypass': 'true',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      }
    }).pipe(
      tap(() => {
        // ✅ Update memories$ observable after deletion
        const current = this.memoriesSubject.value;
        this.memoriesSubject.next(current.filter((m: any) => m.id !== id));
        this.notify('Memory deleted successfully', 'success', 'check-circle');
      }),
      catchError((error) => {
        const message = error.error?.message || 'Erreur lors de la suppression de la mémoire';
        this.notify(message, 'danger', 'exclamation-triangle');
        return of(error);
      })
    );
  }

  history(clear?: boolean, agent?: string) {
    // ✅ Use new URL structure with agent parameter
    const agentParam = agent || 'current';
    const params = [];
    if (clear) params.push("clear=true");

    const queryString = params.length > 0 ? "?" + params.join("&") : "";

    const headers = {
      'Content-Type': 'application/json',
      'ngsw-bypass': 'true',
      'Cache-Control': 'no-cache',
    };
    return this.$http.get<ClientDiscussion>(`/api/agent/${agentParam}/history` + queryString, {
      withCredentials: true,
      headers
    }).pipe(
      tap((res: ClientDiscussion) => {
        // Process messages to remove memory content
        if (res.messages && Array.isArray(res.messages)) {
          res.messages = res.messages.map((msg: any) => {
            if (typeof msg.content === 'string') {
              msg.content = msg.content.replace(/<memories [^>]+[\s\S]*?<\/memories>/g, '');
            }
            return msg;
          });
        }

        // console.log('🐛 DBG processed messages:', res.messages?.length || 0);

        // Update StateGraph discussion
        this.discussionSubject.next(res);

        // Update state - use agent from response if available, fallback to parameter or current state
        const responseAgent = res.agent;
        const finalAgent = responseAgent || agent || this.state.agent;

        const state: any = {
          usage: res.usage || this.defaultUsage,
          agent: finalAgent,
        };

        this.stateSubject.next(state);
      }),
      catchError((error) => {
        console.log('🐛 DBG history() error:', error);
        const message = error.error?.message || 'Erreur lors du chargement de l\'historique';
        this.notify(message, 'danger', 'exclamation-triangle');
        return of(error);
      })
    );
  }

  chat(prompt: string, options?: {runAgent?: string, ragname?: string, thinking?: boolean}) {
    const {runAgent, ragname, thinking} = options || {};
    prompt = prompt.trim();
    const isShort = ['continue','1','2','3','4','5','6','7','8','9','c','help','ci','cc','cm','cs','edgar','help'].indexOf(prompt) > -1;
    if(!isShort && (prompt.length < 3 || typeof prompt !== 'string'  )) {
      return of('');
    }

    // ✅ Use new URL structure with agent parameter
    const agentParam = runAgent || 'current';
    const streamUrl = `/api/agent/${agentParam}`;

    // ✅ Add ragname to request body if provided
    const requestBody: any = {query: prompt, agent: runAgent, thinking };
    if (ragname) {
      requestBody.ragname = ragname;
    }

    console.log('🐛 DBG chat() requestBody:', requestBody);

    return this.stream(streamUrl, requestBody).pipe(
      tap({
        complete: () => {
          // ✅ Sync with history after streaming completes
          // this.history(false, runAgent).subscribe();
        }
      })
    );
  }

  /**
   * ✅ Add temporary user message to discussion
   */
  private addTemporaryUserMessage(prompt: string, agent: string) {
    const currentDiscussion = this.discussionSubject.value;
    const tempMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user' as const,
      content: prompt,
      timestamp: new Date()
    };

    // Update discussion with temporary user message
    this.discussionSubject.next({
      ...currentDiscussion,
      messages: [...currentDiscussion.messages, tempMessage],
      updatedAt: new Date()
    });
  }

  /**
   * ✅ Create temporary assistant message at start of streaming
   */
  private createTemporaryAssistantMessage(): string {
    const currentDiscussion = this.discussionSubject.value;
    const messages = [...currentDiscussion.messages];

    const message = messages.find(msg =>
      msg.role === 'assistant' && msg.id.startsWith('temp-assistant-')
    );
    if(message){
      return message.id;
    }

    // Create new temporary assistant message with empty steps
    const tempAssistantMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      steps: [] as AssistantStep[]
    };
    messages.push(tempAssistantMessage);

    // Update discussion with new assistant message
    this.discussionSubject.next({
      ...currentDiscussion,
      messages,
      updatedAt: new Date()
    });

    return tempAssistantMessage.id;
  }

  /**
   * ✅ Update existing temporary assistant message (no discussionSubject.next)
   */
  private updateTemporaryAssistantMessage(content: string, steps?: AssistantStep[]) {
    const currentDiscussion = this.discussionSubject.value;
    const messages = currentDiscussion.messages;

    // Find existing temporary assistant message
    const assistantMsgIndex = messages.findIndex(msg =>
      msg.role === 'assistant' && msg.id.startsWith('temp-assistant-')
    );

    if (assistantMsgIndex !== -1) {
      // Update existing temporary assistant message directly (no new object)
      const existingMessage = messages[assistantMsgIndex];
      existingMessage.content = content;
      if (steps) {
        existingMessage.steps = steps;
      }
      // ✅ No discussionSubject.next here - direct mutation for performance
    }
  }

  stream(url: string, body: any) {
    return new Observable<string>(observer$ => {
      // ✅ Create temporary user message and update state
      const agentParam = body.agent || 'current';
      this.addTemporaryUserMessage(body.query, agentParam);

      this.updateState({
        status: 'prompt',
        content: body.query,
        agent: body.agent || this.state.agent,
        thinking: body.thinking || false
      });

      // ✅ Use HttpRequest with reportProgress - MSAL interceptor will add token automatically!
      const headers = new HttpHeaders()
        .set('Accept', 'text/event-stream')
        .set('Cache-Control', 'no-cache')
        .set('ngsw-bypass', 'true');

      const request = new HttpRequest('POST', url, body, {
        reportProgress: true,
        responseType: 'text',
        headers: headers
      });

      let responseText = '';
      let lastIndex = 0;
      let stepsAccum: AssistantStep[] = [];
      let contentAccum = '';
      let messageCreated = false;

      // ✅ Subscribe to HTTP events with automatic token handling
      const subscription = this.$http.request(request).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.DownloadProgress) {
            // ✅ Streaming in progress
            if (!messageCreated) {
              this.createTemporaryAssistantMessage();
              messageCreated = true;
            }

            // Get partial text from event
            const partialText = (event as any).partialText || '';
            if (partialText) {
              responseText = partialText;
              const textChunk = responseText.substring(lastIndex);
              lastIndex = responseText.length;

              // ✅ Parse steps incrementally from this chunk for minimum latency
              const chunkSteps = parseSteps(textChunk);
              if (chunkSteps.length) {
                stepsAccum = [...stepsAccum, ...chunkSteps];
                this.updateState({
                  status: 'running',
                  steps: stepsAccum,
                  agent: body.agent
                });
              }

              // ✅ Append content incrementally and update temp assistant message
              const cleanedChunk = this.cleanText(textChunk);
              if (cleanedChunk && cleanedChunk.trim()) {
                contentAccum += cleanedChunk;
                this.updateState({
                  status: 'running',
                  content: contentAccum,
                  agent: body.agent
                });
                this.updateTemporaryAssistantMessage(contentAccum, stepsAccum);
              }

              observer$.next(cleanedChunk);
            }
          } else if (event.type === HttpEventType.Response) {
            // ✅ Stream completed
            this.updateState({
              status: 'end',
              agent: body.agent || this.state.agent,
              content: undefined,  // ✅ Clear streaming data
              steps: undefined     // ✅ Clear steps data
            });
            observer$.complete();
          }
        },
        error: (err) => {
          console.error('HTTP stream error:', err);
          this.updateState({
            status: 'error',
            error: err.status === 401 ? 'authentication' : 'server',
            agent: body.agent || this.state.agent,
            content: undefined,
            steps: undefined
          });
          observer$.error(err);
        }
      });

      // ✅ Cleanup function
      return () => {
        subscription.unsubscribe();
      };
    });
  }

  async whisper(state): Promise<string> {
    if ((!state?.blob && !state?.chunk) || state.silent) {
      return '';
    }

    const formData = new FormData();
    formData.append('audio', state.blob);
    formData.append('type', state.type);
    formData.append('file','audio.wav');

    // ✅ Ajouter la transcription précédente comme contexte pour Whisper
    if (state.previousText) {
      formData.append('previousText', state.previousText);
    }

    try {
      const resp = await this.$http.post<{transcription: string}>('/api/transcribe', formData, {
        withCredentials: true
      }).toPromise();

      const transcription = resp.transcription || '';
      this.transcriptionsSubject.next(transcription);
      return transcription;
    } catch (error: any) {
      console.error('❌ Erreur transcription:', error);

      // FIXME  rationalize errors with a function
      //
      // Extraire le message d'erreur du serveur
      // - error.error contient la réponse JSON du serveur
      let errorMessage = 'Erreur lors de la transcription audio';
      let errorIcon = 'exclamation-triangle';

      if (error.status === 413) {
        // Erreur 413 - Fichier trop volumineux
        errorMessage = error.error?.message || 'Le fichier audio est trop volumineux';
        const limit = error.error?.limit || '10MB';
        errorMessage += ` (limite: ${limit})`;
        errorIcon = 'exclamation-octagon';
      } else if (error.status === 400) {
        // Erreur 400 - Format non supporté ou autre erreur
        errorMessage = error.error?.error || error.error?.message || 'Format audio non supporté';
      } else if (error.status === 0) {
        // Erreur réseau
        errorMessage = 'Erreur de connexion au serveur';
      } else {
        // Autres erreurs
        errorMessage = error.error?.message || error.message || errorMessage;
      }

      // Afficher la notification à l'utilisateur
      this.notify(errorMessage, 'danger', errorIcon, 10000);

      // Propager l'erreur pour que les composants puissent réagir
      throw new Error(errorMessage);
    }
  }

  abort() {
    this.updateState({
      status: 'end'
    });
  }

  sendFeedback(evaluation: any, message: any) {
    // your logic with $metric
  }

  notify(message:string, variant = 'primary', icon = 'info-circle', duration = 9000) {
    const escapeHtml = (html:string) => {
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    }

    const alert = Object.assign(document.createElement('sl-alert'), {
      variant,
      closable: true,
      duration: duration,
      innerHTML: `
        <sl-icon name="${icon}" slot="icon"></sl-icon>
        ${escapeHtml(message)}
      `
    });

    document.body.append(alert);
    return alert.toast();
  }
}
