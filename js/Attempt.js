import data from 'core/js/data';

export default class Attempt {

  /**
   * @param {Asessment} assessment The AssessmentSet of the attempt
   */
  constructor(assessment) {
    this._assessment = assessment;
    this._isInSession = false;
    this.reset();
  }

  /**
   * Start the attempt
   */
  start() {
    this._isInSession = true;
    this._isInProgress = true;
  }

  /**
   * Update the attempt scores
   */
  updateScore() {
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
    this._questionTrackingPositions = data[1];
    this._isInProgress = (attemptData[0] === 1);
    this._minScore = attemptData[1];
    this._maxScore = attemptData[2];
    this._score = attemptData[3];
    this._correctness = attemptData[4];
    this._isComplete = (attemptData[5] === 1);
    this._isPassed = (attemptData[6] === 1);
  }

  get questions() {
    const questionTrackingPositions = this._questionTrackingPositions || this._assessment.questions.map(question => question.trackingPosition);
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
  }

  /**
   * Returns whether the attempt is in session
   * @returns {boolean}
   */
  get isInSession() {
    return this._isInSession;
  }

  /**
   * Set whether the attempt is in session
   * @param {boolean} value
   */
  set isInSession(value) {
    this._isInSession = value;
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
   * Returns whether the attempt is passed
   * @returns {boolean}
   */
  get isPassed() {
    return this._isPassed;
  }

  /**
   * Returns the state to save to offlineStorage
   * @returns {Array}
   */
  get saveState() {
    this._questionTrackingPositions = this._assessment.questions.map(question => question.trackingPosition);
    return [
      [
        this.isInProgress ? 1 : 0,
        this.minScore,
        this.maxScore,
        this.score,
        this.correctness,
        this.isComplete ? 1 : 0,
        this.isPassed ? 1 : 0
      ],
      this._questionTrackingPositions
    ];
  }

}
