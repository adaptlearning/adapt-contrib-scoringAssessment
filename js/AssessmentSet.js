import Adapt from 'core/js/adapt';
import Router from 'core/js/router';
import Location from 'core/js/location';
import Logging from 'core/js/logging';
import offlineStorage from 'core/js/offlineStorage';
import Passmark from './Passmark';
import Attempts from './Attempts';
import Attempt from './Attempt';
import Marking from './Marking';
import Reset from './Reset';
import AssessmentState from './AssessmentState';
import _ from 'underscore';
import {
  hasHashChanged,
  isModelAvailableInHierarchy,
  ScoringSet
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';
import {
  setupBackwardCompatibility,
  triggerCompatibleComplete,
  triggerCompatibleRegister,
  triggerCompatibleRestored,
  triggerCompatiblePreReset,
  triggerCompatibleReset,
  triggerCompatiblePostReset
} from './compatibility';

export default class AssessmentSet extends ScoringSet {

  initialize(options = {}) {
    const {
      _id,
      _isScoreIncluded,
      _isCompletionRequired
    } = (options._model ?? options.model).get('_scoringAssessment');
    super.initialize({
      ...options,
      _id,
      _title: (options._title ?? options.title),
      _type: 'assessment',
      _isScoreIncluded: _isScoreIncluded ?? false,
      _isCompletionRequired: _isCompletionRequired ?? false
    });
    this._isBackwardCompatible = options._isBackwardCompatible ?? false;
    if (this.isIntersectedSet) {
      // copy from existing instance
      this._resetConfig = options._resetConfig;
      this._passmark = options._passmark;
      this._marking = options._marking;
      this._attempt = options._attempt;
      this._attempts = options._attempts;
    } else {
      this._resetConfig = new Reset(this.config?._reset);
      this._passmark = new Passmark(this.config?._passmark);
      this._marking = new Marking(this.config?._questions?._canShowMarking, this.config?._suppressMarking);
      this._attempt = new Attempt(this);
      this._attempts = new Attempts(this.config?._attempts, this);
    }
    this._isInSession = false;
    this._isInReset = false;
    if (this.isIntersectedSet) return;
    // no need to setup backward compatibility on intersected sets
    setupBackwardCompatibility(this);
  }

  /**
   * Fetch the config object from the set model.
   * @returns {Object}
   */
  get config() {
    return this.model.get('_scoringAssessment');
  }

  /**
   * Create a custom assessment state save and restore object.
   * @returns {AssessmentState}
   */
  get state() {
    if (this.isIntersectedSet) return null;
    return (this._state = this._state || new AssessmentState({ set: this }));
  }

  /**
   * Returns whether the assessment is in session
   * @returns {boolean}
   */
  get isInSession() {
    return this._isInSession;
  }

  /**
   * Returns whether all models have been added
   * @returns {boolean}
   */
  get isAwaitingChildren() {
    return this.model.get('_requireCompletionOf') === Number.POSITIVE_INFINITY;
  }

  /** @override */
  get minScore() {
    if (!this.isIntersectedSet && this.isComplete && !this.isInSession) return this.attempts.last.minScore;
    return super.minScore;
  }

  /** @override */
  get maxScore() {
    if (!this.isIntersectedSet && this.isComplete && !this.isInSession) return this.attempts.last.maxScore;
    return super.maxScore;
  }

  /** @override */
  get score() {
    if (!this.isIntersectedSet && this.isComplete && !this.isInSession) return this.attempts.last.score;
    return super.score;
  }

  /** @override */
  get correctness() {
    if (!this.isIntersectedSet && this.isComplete && !this.isInSession) return this.attempts.last.correctness;
    return super.correctness;
  }

  /**
   * Returns the passmark model
   * @returns {Passmark}
   */
  get passmark() {
    return this._passmark;
  }

  /**
   * Returns the attempts model
   * @returns {Attempts}
   */
  get attempts() {
    return this._attempts;
  }

  /**
   * Returns the attempt model
   * @returns {Attempt}
   */
  get attempt() {
    return this._attempt;
  }

  /**
   * Returns the marking model
   * @returns {Marking}
   */
  get marking() {
    return this._marking;
  }

  /**
   * Returns the reset model
   * @returns {Reset}
   */
  get resetConfig() {
    return this._resetConfig;
  }

  /** @override */
  get canReset() {
    const config = this.isPassed ? this.resetConfig.passedConfig : this.resetConfig.failedConfig;
    return this.attempts.hasRemaining && config._canReset;
  }

  /**
   * Returns whether the set should be reset when revisited
   * @returns {boolean}
   */
  get shouldResetOnRevisit() {
    const config = this.isPassed
      ? this.resetConfig.passedConfig
      : this.resetConfig.failedConfig;
    return !this.attempt.isInProgress && this.canReset && config._isResetOnRevisit;
  }

  /**
   * Returns whether all components are configured to "soft" reset
   * @returns {boolean}
   */
  get isSoftReset() {
    const hasQuestions = this.availableQuestions.length > 0;
    const hasPresentationComponents = this.presentationComponents.length > 0;
    const hasQuestionsSoftReset = !hasQuestions || this.resetConfig.questionsType === 'soft';
    const hasPresentationComponentsSoftReset = !hasPresentationComponents || this.resetConfig.presentationComponentsType === 'soft';
    return hasQuestionsSoftReset && hasPresentationComponentsSoftReset;
  }

  /**
   * Returns whether the page can be reloaded
   * @returns {boolean}
   */
  get canReload() {
    const pageId = this.model.findAncestor('page')?.get('_id');
    const locationId = Location._currentId;
    return pageId === locationId && this.model.get('_isRendered');
  }

  /** @override */
  get isOptional() {
    return this.model.get('_isOptional');
  }

  /** @override */
  get isAvailable() {
    return isModelAvailableInHierarchy(this.model);
  }

  /**
   * Returns whether all components have been completed in the last attempt
   * @returns {boolean}
   */
  get isAttemptComplete() {
    if (this.isAwaitingChildren || !this.isAvailable) return false;
    return this.availableTrackableComponents.every(model => model.get('_isInteractionComplete'));
  }

  /**
   * Returns whether the assessment is completed.
   * A previously completed assessment which has been "soft" reset, will be deemed completed when not in session.
   * When an attempt is currently in session, it will return that attempt value for use in `ScoringSet.update`.
   * @override
   * @returns {boolean}
   */
  get isComplete() {
    if (this.isAwaitingChildren || !this.isAvailable) return false;
    if (this.isInSession) return this.isAttemptComplete;
    if (this.isSoftReset) return this.attempts.wasComplete;
    return this.availableTrackableComponents.every(model => model.get('_isComplete'));
  }

  /**
   * Returns whether the configured passmark has been achieved.
   * A previously completed assessment which has been "soft" reset, will be deemed passed when not in session.
   * When an attempt is currently in session, it will return that attempt value for use in `ScoringSet.update`.
   * @override
   * @returns {boolean}
   */
  get isPassed() {
    const isComplete = this.isComplete;
    if (this.attempt?.isInProgress && !isComplete) return false; // must be completed to pass
    if (!this.passmark.isEnabled && isComplete) return true; // always pass if complete and passmark is disabled
    if (!this.isInSession && this.isSoftReset) return this.attempts.wasPassed;
    const isScaled = this.passmark.isScaled;
    const score = (isScaled) ? this.scaledScore : this.score;
    const correctness = (isScaled) ? this.scaledCorrectness : this.correctness;
    const isPassed = score >= this.passmark.score && correctness >= this.passmark.correctness;
    return isPassed;
  }

  /** @override */
  register() {
    triggerCompatibleRegister(this);
    super.register(this);
  }

  /** @override */
  async onInit() {
    this._setModelsOwnership();
  }

  /**
   * Set models to be part of the assessment for other plugins
   * @private
   */
  _setModelsOwnership() {
    this.models.forEach(model => model.setOnChildren({
      _isPartOfAssessment: true
    }));
  }

  /**
   * @override
   * @fires Adapt#assessments:restored
   * @fires Adapt#scoring:assessment:restored
   * @fires Adapt#scoring:set:restored
   */
  async onRestore() {
    const restored = this.state.restore();
    if (!restored) return false;
    triggerCompatibleRestored(this);
    await super.onRestore();
    return true;
  }

  /** @override */
  async onStart() {
    this._isInReset = true;
    triggerCompatiblePreReset(this);
    Adapt.trigger('scoring:assessment:preReset', this);
    this.availableQuestions.forEach(model => model.reset(this.resetConfig._questionsType, true));
    this.availablePresentationComponents.forEach(model => model.reset(this.resetConfig._presentationComponentsType, true));
    this.attempts.reset(this.isSoftReset);
    this._attempt = new Attempt(this);
    await Adapt.deferUntilCompletionChecked();
    triggerCompatibleReset(this);
    this._overrideQuestionsConfig();
    this.attempt.start();
    this.state.save();
    if (this.canReload) this.reload();
    _.defer(() => {
      triggerCompatiblePostReset(this);
      Adapt.trigger('scoring:assessment:postReset', this);
      this._isInReset = false;
    });
    await super.onStart();
  }

  /**
   * Override questions configuration to control marking, feedback and model answers
   * @private
   * @todo Add option to `_suppressFeedback` so user can review once completed and no attempts remaining?
   */
  _overrideQuestionsConfig() {
    const isMarkingEnabled = this.marking.isEnabled && !(this.marking.isSuppressed && this.attempts.hasRemaining);
    const config = this.config?._questions;
    this.questions.forEach(model => {
      model.set({
        _canShowFeedback: config?._canShowFeedback ?? false,
        _canShowMarking: isMarkingEnabled,
        _canShowModelAnswer: isMarkingEnabled && (config?._canShowModelAnswer ?? false)
      }, { pluginName: 'scoringAssessment' });
    });
  }

  /** @override */
  async onUpdate() {
    await super.onUpdate();
    this.attempt.updateScore();
    if (!hasHashChanged(this, this.attempt.hashed())) return;
    Logging.debug(`${this.id} minScore: ${this.minScore}, maxScore: ${this.maxScore}`);
    Logging.debug(`${this.id} score: ${this.score}, scaledScore: ${this.scaledScore}`);
    Logging.debug(`${this.id} isAttemptComplete: ${this.isAttemptComplete}, isComplete: ${this.isComplete}, isPassed: ${this.isPassed}`);
    if (Adapt.get('_isStarted')) this.state.save();
  }

  /** @override */
  async onVisit() {
    this._isInSession = true;
    if (this.attempt.isInProgress) return;
    if (this._isInReset) return;
    if (this._isReloading) {
      this._isReloading = false;
      return;
    }
    if (!this.shouldResetOnRevisit) return;
    offlineStorage.set('location', '');
    await this.reset();
    await super.onVisit();
  }

  /**
   * Reload the page and scroll to element if configured
   */
  reload() {
    this._isReloading = true;
    const id = this.resetConfig._scrollTo ? this.model.get('_id') : Location._currentId;
    Router.navigate(`#/id/${id}`, { replace: true, trigger: true });
  }

  /**
   * @override
   * @fires Adapt#assessments:complete
   * @fires Adapt#scoring:assessment:complete
   * @fires Adapt#scoring:set:complete
   */
  async onCompleted() {
    if (this.attempt.isInProgress) {
      this.attempt.end();
      this.attempts.spend();
      this.attempts.record(this.attempt);
      this.state.save();
    }
    if (this.marking.isEnabled && this.marking.isSuppressed && !this.attempts.hasRemaining) {
      this._overrideQuestionsConfig();
      this.availableQuestions.forEach(model => model.refresh());
    }
    triggerCompatibleComplete(this);
    await super.onCompleted();
  }

  /** @override */
  async onLeave() {
    this._isInSession = false;
    await super.onLeave();
  }

}
