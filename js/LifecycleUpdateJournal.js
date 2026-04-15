import {
  LifecycleUpdateJournal
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

export default class AssessmentLifecycleUpdateJournal extends LifecycleUpdateJournal {

  /** @override */
  get setData() {
    return {
      ...super.setData,
      isAttemptComplete: this.set.isAttemptComplete
    };
  }

}
