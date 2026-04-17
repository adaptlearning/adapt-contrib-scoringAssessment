import {
  ScoringUpdateJournal
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

export default class AssessmentUpdateJournal extends ScoringUpdateJournal {

  /** @override */
  get setData() {
    return {
      ...super.setData,
      isAttemptComplete: this.set.isAttemptComplete
    };
  }

}
