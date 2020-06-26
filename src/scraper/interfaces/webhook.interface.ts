export interface WebhookData {
  date: Date;
  candidateID: number;
  offerID: number;
  name: string;
  position: string;
  why: string;
  phone: string;
  email: string;
  details: string;
  linkedin: string;
  internalPositionName: string;
  files: string[];
  gdpr_accepted: boolean;
  source: 'SMITIO' | undefined;
}
