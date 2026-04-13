import {
  Journal
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

export default class AssessmentJournal extends Journal {

  /** @override */
  get setData() {
    return {
      ...super.setData,
      isAttemptComplete: this.set.isAttemptComplete
    };
  }

}
