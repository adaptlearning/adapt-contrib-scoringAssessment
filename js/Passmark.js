export default class Passmark {

  constructor({
    _isEnabled = true,
    _score = 60,
    _correctness = 60,
    _isScaled = true
  } = {}) {
    this._isEnabled = _isEnabled;
    this._score = _score;
    this._correctness = _correctness;
    this._isScaled = _isScaled;
  }

  /**
   * Returns whether the passmark is required
   * @returns {boolean}
   */
  get isEnabled() {
    return this._isEnabled;
  }

  /**
   * Returns the score required for passing
   * @returns {number}
   */
  get score() {
    return this._score;
  }

  /**
   * Returns the correctness required for passing
   * @returns {number}
   */
  get correctness() {
    return this._correctness;
  }

  /**
   * Returns whether the `score` is to be used as a percentage
   * @returns {boolean}
   */
  get isScaled() {
    return this._isScaled;
  }

}
