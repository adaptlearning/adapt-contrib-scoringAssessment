import data from 'core/js/data';
import {
  hash,
  getScaledScoreFromMinMax
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

export default class Attempt {

  /**
   * @param {AssessmentSet} assessment The AssessmentSet of the attempt
   */
  constructor(assessment) {
    this._assessment = assessment;
    this.reset();
  }

  /**
   * Start the attempt
   */
  start() {
    this._isInProgress = true;
  }

  /**
   * Update the attempt
   */
  update() {
    if (!this.isInProgress) return;
    this._minScore = this._assessment.minScore;
    this._maxScore = this._assessment.maxScore;
    this._score = this._assessment.score;
    this._correctness = this._assessment.correctness;
  }

  /**
   * End the attempt
   */
  end() {
    this._isPassed = this._assessment.isPassed;
    this._isComplete = true;
    this._isInProgress = false;
  }

  /**
   * Restore attempt from previous session
   * @param {Array} data
   */
  restore(data) {
    const attemptData = data[0];
    const attemptPassedData = attemptData[6];
    this._questionTrackingPositions = data[1];
    this._isInProgress = Boolean(attemptData[0]);
    this._minScore = attemptData[1];
    this._maxScore = attemptData[2];
    this._score = attemptData[3];
    this._correctness = attemptData[4];
    this._isComplete = Boolean(attemptData[5]);
    this._isPassed = attemptPassedData === -1
      ? null
      : Boolean(attemptPassedData);
  }

  get questions() {
    const questionTrackingPositions = this._questionTrackingPositions || this._assessment.availableQuestions.map(question => question.trackingPosition);
    return questionTrackingPositions.map(trackingPosition => data.findByTrackingPosition(trackingPosition));
  }

  /**
   * Reset the attempt
   */
  reset() {
    this._isInProgress = false;
    this._minScore = 0;
    this._maxScore = 0;
    this._score = 0;
    this._correctness = 0;
    this._isComplete = false;
    this._isPassed = false;
    this._questionTrackingPositions = [];
  }

  /**
   * Returns whether the attempt is in progress
   * @returns {boolean}
   */
  get isInProgress() {
    return this._isInProgress;
  }

  /**
   * Returns the minimum score
   * @returns {number}
   */
  get minScore() {
    return this._minScore;
  }

  /**
   * Returns the maximum score
   * @returns {number}
   */
  get maxScore() {
    return this._maxScore;
  }

  /**
   * Returns the score
   * @returns {number}
   */
  get score() {
    return this._score;
  }

  /**
   * Returns a percentage score relative to a positive minimum or zero and maximum values
   * @returns {number}
   */
  get scaledScore() {
    return getScaledScoreFromMinMax(this.score, this.minScore, this.maxScore);
  }

  /**
   * Returns the number of correctly answered questions
   * @returns {number}
   */
  get correctness() {
    return this._correctness;
  }

  /**
   * Returns whether the attempt is completed
   * @returns {boolean}
   */
  get isComplete() {
    return this._isComplete;
  }

  /**
   * Returns whether the attempt is passed.
   * Returns null if the attempt was recorded when passmark was disabled.
   * @returns {boolean|null}
   */
  get isPassed() {
    return this._isPassed;
  }

  /**
   * Returns the state to save to offlineStorage
   * @returns {Array}
   */
  get saveState() {
    const isPassed = this.isPassed;
    this._questionTrackingPositions = this._assessment.availableQuestions.map(question => question.trackingPosition);
    return [
      [
        this.isInProgress ? 1 : 0,
        this.minScore,
        this.maxScore,
        this.score,
        this.correctness,
        this.isComplete ? 1 : 0,
        isPassed === null
          ? -1
          : (isPassed ? 1 : 0)
      ],
      this._questionTrackingPositions
    ];
  }

  /**
   * Hash the state using the 'times 33' hash algorithm.
   * @return {string}
   */
  async hashed() {
    return hash(this.saveState);
  }

}
