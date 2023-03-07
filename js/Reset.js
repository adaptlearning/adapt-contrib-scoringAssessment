export default class Reset {

  constructor(config = {}) {
    this._reloadPage = config._reloadPage ?? true;
    this._scrollTo = config._scrollTo ?? true;
    this._questionsType = config._questionsType ?? 'hard';
    this._presentationComponentsType = config._presentationComponentsType ?? 'soft';
    this._failedConfig = Object.assign({
      _isResetOnRevisit: true,
      _canReset: true
    }, config?._failed);
    this._passedConfig = Object.assign({
      _isResetOnRevisit: true,
      _canReset: true
    }, config?._passed);
  }

  /**
   * Returns whether to reload the page on reset
   * @returns {boolean}
   */
  get reloadPage() {
    return this._reloadPage;
  }

  /**
   * Returns whether to scroll to the test on reset
   * @returns {boolean}
   */
  get scrollTo() {
    return this._scrollTo;
  }

  /**
   * Returns the reset type for question models
   * @returns {string}
   */
  get questionsType() {
    return this._questionsType;
  }

  /**
   * Returns the reset type for presentation component models
   * @returns {string}
   */
  get presentationComponentsType() {
    return this._presentationComponentsType;
  }

  /**
   * Returns the failed config
   * @returns {Object}
   */
  get failedConfig() {
    return this._failedConfig;
  }

  /**
   * Returns the passed config
   * @returns {Object}
   */
  get passedConfig() {
    return this._passedConfig;
  }

}
