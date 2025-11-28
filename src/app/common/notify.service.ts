import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// ============================================================================
// NotifyService - Remplace MdcSnackbar avec des toasts CSS modernes
// ============================================================================

export interface NotifyOptions {
  duration?: number;        // Durée d'affichage en ms (défaut: 5000)
  timeoutMs?: number;       // Alias pour duration (compatibilité MdcSnackbar)
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: string;          // Texte du bouton d'action
  dismiss?: boolean;        // Afficher le bouton de fermeture
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right';
}

interface ToastItem {
  id: number;
  message: string;
  options: NotifyOptions;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private container: HTMLElement | null = null;
  private toasts: ToastItem[] = [];
  private nextId = 0;

  // Subject pour les actions
  private actionSubject = new Subject<{ id: number; action: string }>();

  constructor() {
    this.createContainer();
  }

  /**
   * Affiche une notification toast
   * @param message Le message à afficher
   * @param action Texte du bouton d'action (optionnel)
   * @param options Options de configuration
   * @returns L'ID du toast pour annulation
   */
  open(message: string, action?: string, options?: NotifyOptions): number {
    const id = this.nextId++;
    const defaultOptions: NotifyOptions = {
      duration: options?.timeoutMs || options?.duration || 5000,  // Support timeoutMs (MdcSnackbar compat)
      type: 'info',
      dismiss: true,
      position: 'bottom',
      ...options,
      action: action || options?.action
    };

    const toast: ToastItem = {
      id,
      message,
      options: defaultOptions,
      visible: false
    };

    this.toasts.push(toast);
    this.render();

    // Animation d'entrée
    setTimeout(() => {
      toast.visible = true;
      this.render();
    }, 10);

    // Auto-dismiss
    if (defaultOptions.duration && defaultOptions.duration > 0) {
      setTimeout(() => this.dismiss(id), defaultOptions.duration);
    }

    return id;
  }

  /**
   * Raccourci pour notification de succès
   */
  success(message: string, action?: string, options?: NotifyOptions): number {
    return this.open(message, action, { ...options, type: 'success' });
  }

  /**
   * Raccourci pour notification d'erreur
   */
  error(message: string, action?: string, options?: NotifyOptions): number {
    return this.open(message, action, { ...options, type: 'error', duration: 8000 });
  }

  /**
   * Raccourci pour notification d'avertissement
   */
  warning(message: string, action?: string, options?: NotifyOptions): number {
    return this.open(message, action, { ...options, type: 'warning' });
  }

  /**
   * Ferme une notification spécifique
   */
  dismiss(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      this.render();

      // Supprimer après l'animation
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.render();
      }, 300);
    }
  }

  /**
   * Ferme toutes les notifications
   */
  dismissAll(): void {
    this.toasts.forEach(t => t.visible = false);
    this.render();

    setTimeout(() => {
      this.toasts = [];
      this.render();
    }, 300);
  }

  /**
   * Observable pour les actions
   */
  onAction() {
    return this.actionSubject.asObservable();
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'kng-notify-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.container);

    // Injecter les styles
    this.injectStyles();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = this.toasts.map(toast => `
      <div class="kng-toast kng-toast--${toast.options.type} ${toast.visible ? 'kng-toast--visible' : ''}"
           data-id="${toast.id}"
           role="alert">
        <div class="kng-toast__content">
          <span class="kng-toast__message">${this.escapeHtml(toast.message)}</span>
        </div>
        <div class="kng-toast__actions">
          ${toast.options.action ? `
            <button class="kng-toast__action" data-action="${this.escapeHtml(toast.options.action)}">
              ${this.escapeHtml(toast.options.action)}
            </button>
          ` : ''}
          ${toast.options.dismiss ? `
            <button class="kng-toast__dismiss" aria-label="Fermer">
              <span class="material-symbols-outlined">close</span>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Attacher les événements
    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.container) return;

    // Boutons de fermeture
    this.container.querySelectorAll('.kng-toast__dismiss').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const toast = (e.currentTarget as HTMLElement).closest('.kng-toast');
        const id = parseInt(toast?.getAttribute('data-id') || '0', 10);
        this.dismiss(id);
      });
    });

    // Boutons d'action
    this.container.querySelectorAll('.kng-toast__action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const toast = (e.currentTarget as HTMLElement).closest('.kng-toast');
        const id = parseInt(toast?.getAttribute('data-id') || '0', 10);
        const action = (e.currentTarget as HTMLElement).getAttribute('data-action') || '';
        this.actionSubject.next({ id, action });
        this.dismiss(id);
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private injectStyles(): void {
    if (document.getElementById('kng-notify-styles')) return;

    const style = document.createElement('style');
    style.id = 'kng-notify-styles';
    style.textContent = `
      .kng-notify-container {
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        display: flex;
        flex-direction: column-reverse;
        gap: 0.5rem;
        max-width: calc(100vw - 2rem);
        width: 100%;
        max-width: 560px;
        pointer-events: none;
      }

      .kng-toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.875rem 1rem;
        background: var(--mdc-theme-appbar-text, #333);
        color: var(--mdc-theme-appbar-light, #fff);
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateY(100%) scale(0.9);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
      }

      .kng-toast--visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .kng-toast__content {
        flex: 1;
        min-width: 0;
      }

      .kng-toast__message {
        font-size: 0.9375rem;
        line-height: 1.4;
        word-break: break-word;
      }

      .kng-toast__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .kng-toast__action {
        background: transparent;
        border: none;
        color: var(--mdc-theme-secondary, #ffcc00);
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.375rem 0.75rem;
        cursor: pointer;
        border-radius: 0.25rem;
        transition: background 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .kng-toast__action:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .kng-toast__dismiss {
        background: transparent;
        border: none;
        color: currentColor;
        opacity: 0.7;
        padding: 0.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: opacity 0.2s, background 0.2s;
      }

      .kng-toast__dismiss:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }

      .kng-toast__dismiss .material-symbols-outlined {
        font-size: 1.25rem;
      }

      /* Types de notification */
      .kng-toast--success {
        background: #2e7d32;
      }

      .kng-toast--error {
        background: #c62828;
      }

      .kng-toast--warning {
        background: #f57c00;
      }

      .kng-toast--info {
        background: var(--mdc-theme-appbar-text, #333);
      }

      /* Responsive */
      @media (max-width: 599px) {
        .kng-notify-container {
          bottom: calc(var(--mdc-theme-bottom-bar, 70px) + 0.5rem);
          left: 0.5rem;
          right: 0.5rem;
          transform: none;
          max-width: none;
        }

        .kng-toast {
          padding: 0.75rem;
        }

        .kng-toast__message {
          font-size: 0.875rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

