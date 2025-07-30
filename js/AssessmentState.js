import {
  State
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

export default class AssessmentState extends State {

  /**
   * Save the state to offlineStorage
   * @todo component/block data required to restore which models were used across sessions when banking not used? Not needed for restoring correctness as before. Needed for role selectors?
   * @todo Have been cases where saving the scores etc was useful for amending issues with user data in xAPI.
   * @todo `score` and `correctness` needed if treating "soft" reset assessments as completed. Could we use question attempts model for restoration instead - would only work if questions can't be reset in component view, so aligns with assessment attempts?
   * @todo Need `minScore` and `maxScore` if using banking?
   */
  save () {
    const data = [
      this.set.attempts.saveState,
      this.set.attempt.saveState
    ];
    super.save(data);
  }

  restore() {
    const restoredData = super.restore();
    if (!restoredData) return false;
    this.set.attempts.restore(restoredData[0]);
    this.set.attempt.restore(restoredData[1]);
    return true;
  }

  get name() {
    return 'sas';
  }

}
