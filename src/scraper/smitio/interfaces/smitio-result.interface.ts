export interface EphemeralCandidateData {
  messageId: number;
  offerId: number;
  articleIndex: number;
  urlDetail: string;
  name: string;
  position: string;
  candidateMessageData?: CandidateMessageHistory[];
}

export interface CandidateMessageHistory {
  message: string;
  cvUrl?: string;
}

export interface GenericCandidate {
  name: string;
  position: string;
}
