// Patch minimal pour satisfaire les types Web Awesome (Angular 12 / TypeScript 4.3)

// Type pour le mode d'assignation des slots (ShadowRoot)
type SlotAssignmentMode = 'manual' | 'named';

// Interface pour les flags de validité des formulaires
interface ValidityStateFlags {
  badInput?: boolean;
  customError?: boolean;
  patternMismatch?: boolean;
  rangeOverflow?: boolean;
  rangeUnderflow?: boolean;
  stepMismatch?: boolean;
  tooLong?: boolean;
  tooShort?: boolean;
  typeMismatch?: boolean;
  valueMissing?: boolean;
}

// Interface pour les états personnalisés des éléments de formulaire
interface CustomStateSet extends Set<string> {
  add(value: string): this;
  delete(value: string): boolean;
  has(value: string): boolean;
}

// Extension de ElementInternals pour les formulaires
interface ElementInternals {
  readonly form: HTMLFormElement | null;
  readonly labels: NodeList;
  readonly validationMessage: string;
  readonly validity: ValidityState;
  readonly willValidate: boolean;
  readonly states: CustomStateSet;

  checkValidity(): boolean;
  reportValidity(): boolean;
  setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void;
  setValidity(flags?: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;

  // Index signature pour les propriétés dynamiques
  [key: string]: any;
}

// Extension de ShadowRootInit pour slotAssignment
interface ShadowRootInit {
  mode: 'open' | 'closed';
  delegatesFocus?: boolean;
  slotAssignment?: SlotAssignmentMode;
}
