import {
  Objective
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';
/** @typedef {import("./Attempt").default} Attempt */

export default class AssessmentObjective extends Objective {

  /** @override */
  setScore() {
    if (this.shouldPreserveState) return;
    super.setScore();
  }

  /** @override */
  resetScore() {
    if (this.set.isSoftReset) return;
    super.resetScore();
  }

  /** @override */
  setStatus() {
    if (this.shouldPreserveState) return;
    super.setStatus();
  }

  /**
   * Return the attempt currently being used for the objective.
   * @returns {Attempt}
   */
  get attempt() {
    if (this.set.attempts.used >= 1 && this.set.isSoftReset) return this.set.attempts.best;
    return this.set.attempt;
  }

  /**
   * Returns whether the objective for the assessment is completed.
   * A previously completed assessment which has been "soft" reset, will remain completed.
   * @override
   * @returns {boolean}
   */
  get isComplete() {
    return this.attempt.isComplete;
  }

  /**
   * Returns whether the objective for the assessment is passed.
   * A previously completed assessment which has been "soft" reset, will remain passed.
   * @override
   * @returns {boolean}
   */
  get isPassed() {
    return this.attempt.isPassed;
  }

  /**
   * Returns whether the previous state should be preserved over the current attempt.
   * A previously completed assessment which has been "soft" reset, should only update if the attempt has been improved.
   * @returns {boolean}
   */
  get shouldPreserveState() {
    return this.set.isSoftReset && this.isComplete && !this.set.attempts.isBestAttempt(this.set.attempt);
  }

}
