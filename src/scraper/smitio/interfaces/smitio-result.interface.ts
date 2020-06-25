export interface EphemeralCandidateData {
  messageId: number;
  articleIndex: number;
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
