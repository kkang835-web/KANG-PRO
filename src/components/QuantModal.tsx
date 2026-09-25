import React from 'react';
import DetailedAnalysisModal from './DetailedAnalysisModal';
import { MatchItem } from '../types';

interface QuantModalProps {
  match: MatchItem;
  initialTab?: string;
  onClose: () => void;
}

export function QuantModal({ match, initialTab, onClose }: QuantModalProps) {
  return (
    <DetailedAnalysisModal 
      isOpen={true} 
      onClose={onClose} 
      matchData={match}
      match={match}
      initialTab={initialTab}
    />
  );
}

export default QuantModal;
