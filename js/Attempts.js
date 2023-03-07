import Attempt from './Attempt';

export default class Attempts {

  constructor({
    _limit = 1,
    _shouldStoreAttempts = false
  } = {}, assessment) {
    this._limit = _limit === 'infinite' ? -1 : parseInt(_limit);
    this._used = 0;
    this._shouldStoreAttempts = _shouldStoreAttempts;
    this._best;
    this._history = [];
    this._assessment = assessment;
  }

  /**
   * Increment attempts used
   */
  spend() {
    this._used++;
  }

  /**
   * Record the attempt.
   * `_shouldStoreAttempts` determines if all attempts are recorded.
   * Last attempt will always be recorded.
   * Best attempt will always be recorded/maintained.
   * @param {Attempt} attempt
   */
  record(attempt) {
    if (!this._shouldStoreAttempts && this.last) this.reset();
    if (attempt.score > (this.best?.score || Number.MIN_SAFE_INTEGER)) this._best = attempt;
    this._history.push(attempt);
  }

  /**
   * Restore attempts from previous session
   * @param {Array} data
   */
  restore(data) {
    const restoreAttempt = (state) => {
      const attempt = new Attempt(this._assessment);
      attempt.restore(state);
      return attempt;
    };
    // due to attempt entries, arrays are nested for serializer
    this._used = data[0][0];
    const bestState = data[1]?.[0];
    if (bestState) this._best = restoreAttempt(bestState);
    this._history = data[2].map(state => restoreAttempt(state));
  }

  /**
   * Reset the attempts unless `_shouldStoreAttempts`.
   * A "soft" reset will maintain the last attempt for maintaining state.
   * @todo Reset best attempt if "hard" reset?
   */
  reset(isSoft = false) {
    if (this._shouldStoreAttempts) return;
    if (!isSoft) {
      this._history = [];
    } else if (this.history.length > 1) {
      this._history = this.history.pop();
    }
  }

  /**
   * Returns the number of attempts allowed
   * @returns {number}
   */
  get limit() {
    return this._limit;
  }

  /**
   * Returns the number of attempts used
   * @returns {number}
   */
  get used() {
    return this._used;
  }

  /**
   * Returns the number of attempts remaining
   * @returns {number}
   */
  get remaining() {
    return this.limit - this.used;
  }

  /**
   * Returns whether there are an infinite number of attempts
   * @returns {boolean}
   */
  get isInfinite() {
    return this.limit <= 0;
  }

  /**
   * Returns whether there are attempts remaining
   * @returns {boolean}
   */
  get hasRemaining() {
    return (this.isInfinite || this.remaining > 0);
  }

  /**
   * Returns the history of attempts
   * @returns {[Attempt]}
   */
  get history() {
    return this._history;
  }

  /**
   * Returns the last completed attempt
   */
  get last() {
    return this.history[this.history.length - 1];
  }

  /**
   * Returns the best attempt
   */
  get best() {
    return this._best;
  }

  /**
   * Returns whether any attempt was ever completed
   * @returns {boolean}
   */
  get wasComplete() {
    return this.best?.isComplete ?? this.history.some(attempt => attempt.isComplete);
  }

  /**
   * Returns whether any attempt was ever passed
   * @returns {boolean}
   */
  get wasPassed() {
    return this.best?.isPassed ?? this.history.some(attempt => attempt.isPassed);
  }

  /**
   * Returns the state to save to offlineStorage
   * @returns {Array}
   */
  get saveState() {
    return [
      // due to attempt entries, nested arrays must be used for serializer
      [
        this.used
      ],
      this.best ? [this.best?.saveState] : [],
      this.history.map(attempt => attempt.saveState)
    ];
  }

}
