import Adapt from 'core/js/adapt';
import Router from 'core/js/router';
import Location from 'core/js/location';
import Logging from 'core/js/logging';
import OfflineStorage from 'core/js/offlineStorage';
import Passmark from './Passmark';
import Attempts from './Attempts';
import Attempt from './Attempt';
import Marking from './Marking';
import Reset from './Reset';
import {
  hasIntersectingHierarchy
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';
import ScoringSet from 'extensions/adapt-contrib-scoring/js/ScoringSet';
import Backbone from 'backbone';
import _ from 'underscore';

const saveStateName = 'sas';

export default class AssessmentSet extends ScoringSet {

  initialize(options = {}, subsetParent = null) {
    this._isBackwardCompatible = options._isBackwardCompatible ?? false;
    this._model = options.model;
    this._config = this.model.get('_scoringAssessment');
    this._resetConfig = new Reset(this._config?._reset);
    this._passmark = new Passmark(this._config?._passmark);
    this._marking = new Marking(this._config?._questions?._canShowMarking, this._config?._suppressMarking);
    this._attempt = new Attempt(this);
    this._attempts = new Attempts(this._config?._attempts, this);
    this._hasReset = false;
    if (!this.subsetParent) {
      this._overrideQuestionConfiguration();
      this._setupBackwardsCompatility();
    }
    super.initialize({
      ...options,
      _id: this._config._id,
      title: this._config.title,
      _type: 'assessment',
      _isScoreIncluded: this._config._isScoreIncluded ?? false,
      _isCompletionRequired: this._config._isCompletionRequired ?? false
    }, subsetParent);
  }

  /**
   * @extends
   */
  register() {
    if (this._isBackwardCompatible) Adapt.trigger('assessments:register', this._compatibilityState, this.model);
    super.register(this);
  }

  /**
   * @private
   * @todo Add option to `_suppressFeedback` so user can review once completed and no attempts remaining?
   */
  _overrideQuestionConfiguration() {
    const isMarkingEnabled = this.marking.isEnabled && !(this.marking.isSuppressed && this.attempts.hasRemaining);
    this.questions.forEach(model => {
      model.set({
        _canShowFeedback: this._config?._questions?._canShowFeedback ?? false,
        _canShowMarking: isMarkingEnabled,
        _canShowModelAnswer: isMarkingEnabled && (this._config?._questions?._canShowModelAnswer ?? false),
        _isPartOfAssessment: true
      }, { pluginName: 'scoringAssessment' });
    });
  }

  /**
   * @extends
   */
  _setupListeners() {
    super._setupListeners();
    this.listenTo(Adapt, 'router:location', this.onRouterLocation);
    this.listenTo(this.model, 'change:_isComplete', this.onModelIsCompleteChange);
  }

  /**
   * @private
   */
  _setupBackwardsCompatility() {
    if (!this._isBackwardCompatible) return;
    this.model.getState = () => this._compatibilityState;
    this.model.canResetInPage = () => this.canReset && this.canReload;
    const originalReset = this.model.reset;
    this.model.reset = (force, done) => {
      if (force === false) return;
      this.reset().then(() => {
        typeof done === 'function' && done(true);
        originalReset.call(this.model, force);
      });
    };
    const assessmentMock = {};
    Object.defineProperty(assessmentMock, '_isResetOnRevisit', {
      get: () => {
        // Allow this value to change, providing compatibility for assessmentResults
        return this.shouldResetOnRevisit;
      }
    });
    this.model.set('_assessment', assessmentMock);
  }

  /**
   * @private
   */
  get _compatibilityState() {
    const state = {
      id: this._config._id,
      type: 'article-assessment',
      pageId: this.model.getParent().get('_id'),
      articleId: this.model.get('_id'),
      isEnabled: this._config._isEnabled,
      isComplete: this.isComplete,
      isPercentageBased: this.passmark.isScaled,
      scoreToPass: this.passmark.score,
      score: this.score,
      scoreAsPercent: this.scaledScore,
      minScore: this.minScore,
      maxScore: this.maxScore,
      correctCount: this.correctness,
      correctAsPercent: this.scaledCorrectness,
      correctToPass: this.passmark.correctness,
      questionCount: this.models.length,
      isPass: this.isPassed,
      includeInTotalScore: this._config._isScoreIncluded,
      assessmentWeight: 1,
      attempts: this.attempts.isInfinite ? 'infinite' : this.attempts.limit,
      attemptsSpent: this.attempts.used,
      attemptsLeft: this.attempts.isInfinite ? 'infinite' : this.attempts.remaining,
      attemptInProgress: false,
      lastAttemptScoreAsPercent: null,
      questions: this.questions.map(model => ({ _id: model.get('_id'), _isCorrect: model.get('_isCorrect') })),
      resetType: this.resetConfig.scoringType,
      allowResetIfPassed: this.resetConfig.passedConfig._canReset,
      questionModels: new Backbone.Collection(this.questions)
    };
    return state;
  }

  /**
   * @override
   * @fires Adapt#assessments:restored
   * @fires Adapt#scoring:assessment:restored
   */
  restore() {
    const storedData = OfflineStorage.get(saveStateName)?.[this.id];
    if (storedData) {
      const data = OfflineStorage.deserialize(storedData);
      this.attempts.restore(data[0]);
      this.attempt.restore(data[1]);
    }
    if (this._isBackwardCompatible) Adapt.trigger('assessments:restored', this._compatibilityState, this.model);
    Adapt.trigger('scoring:assessment:restored', this);
  }

  /**
   * @extends
   */
  update() {
    Logging.debug(`${this.id} minScore: ${this.minScore}, maxScore: ${this.maxScore}`);
    Logging.debug(`${this.id} score: ${this.score}, scaledScore: ${this.scaledScore}`);
    Logging.debug(`${this.id} isAttemptComplete: ${this.isAttemptComplete}, isComplete: ${this.isComplete}, isPassed: ${this.isPassed}`);
    if (this.attempt) this.attempt.updateScore();
    super.update();
    if (Adapt.get('_isStarted')) this.save();
  }

  /**
   * Reset all models as configured.
   * Attempts will only be reset when using a "hard" reset.
   * @override
   * @fires Adapt#assessments:preReset
   * @fires Adapt#scoring:assessment:preReset
   * @fires Adapt#assessments:reset
   * @fires Adapt#scoring:assessment:reset
   * @fires Adapt#assessments:postReset
   * @fires Adapt#scoring:assessment:postReset
   * @returns {Promise}
   */
  async reset() {
    if (!this.canReset) return;
    if (this._isBackwardCompatible) Adapt.trigger('assessments:preReset', this._compatibilityState, this.model);
    Adapt.trigger('scoring:assessment:preReset', this);
    this.questions.forEach(model => model.reset(this.resetConfig._questionsType, true));
    this.presentationComponents.forEach(model => model.reset(this.resetConfig._presentationComponentsType, true));
    this.attempts.reset(this.hasSoftReset);
    this._attempt = new Attempt(this);
    this._hasReset = true;
    await Adapt.deferUntilCompletionChecked();
    if (this._isBackwardCompatible) Adapt.trigger('assessments:reset', this._compatibilityState, this.model);
    Adapt.trigger('scoring:assessment:reset', this);
    if (this.canReload) {
      this.reload();
      this.attempt.start();
    }
    _.defer(() => {
      if (this._isBackwardCompatible) Adapt.trigger('assessments:postReset', this._compatibilityState, this.model);
      Adapt.trigger('scoring:assessment:postReset', this);
    });
  }

  /**
   * Reload the page and scroll to element if configured
   */
  reload() {
    const id = this.resetConfig._scrollTo ? this.model.get('_id') : Location._currentId;
    Router.navigate(`#/id/${id}`, { replace: true, trigger: true });
  }

  /**
   * Save the state to offlineStorage
   * @todo component/block data required to restore which models were used across sessions when banking not used? Not needed for restoring correctness as before. Needed for role selectors?
   * @todo Have been cases where saving the scores etc was useful for amending issues with user data in xAPI.
   * @todo `score` and `correctness` needed if treating "soft" reset assessments as completed. Could we use question attempts model for restoration instead - would only work if questions can't be reset in component view, so aligns with assessment attempts?
   * @todo Need `minScore` and `maxScore` if using banking?
   */
  save() {
    const data = OfflineStorage.get(saveStateName) ?? {};
    data[this.id] = OfflineStorage.serialize(this.saveState);
    OfflineStorage.set(saveStateName, data);
  }

  /**
   * Returns the model containing the `_scoringAssessment` config
   * @returns {AdaptModel}
   */
  get model() {
    return this._model;
  }

  /**
   * @override
   */
  get models() {
    const models = this.model.getChildren().toArray();
    return this.filterModels(models);
  }

  /**
   * Returns whether all models have been added
   * @returns {boolean}
   */
  get isAwaitingChildren() {
    return this.model.get('_requireCompletionOf') === Number.POSITIVE_INFINITY;
  }

  /**
   * @extends
   */
  get minScore() {
    if (this.isComplete && !this.attempt?.isInSession) return this.attempts.last.minScore;
    return super.minScore;
  }

  /**
   * @extends
   */
  get maxScore() {
    if (this.isComplete && !this.attempt?.isInSession) return this.attempts.last.maxScore;
    return super.maxScore;
  }

  /**
   * @extends
   */
  get score() {
    if (this.isComplete && !this.attempt?.isInSession) return this.attempts.last.score;
    return super.score;
  }

  /**
   * @extends
   */
  get correctness() {
    if (this.isComplete && !this.attempt?.isInSession) return this.attempts.last.correctness;
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

  /**
   * @override
   */
  get canReset() {
    const config = this.isPassed ? this.resetConfig.passedConfig : this.resetConfig.failedConfig;
    return this.isComplete && this.attempts.hasRemaining && config._canReset && !this._hasReset;
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
   * Returns whether the set contains any components configured to "soft" reset
   * @returns {boolean}
   */
  get hasSoftReset() {
    return (this.questions.length > 0 && this.resetConfig.questionsType === 'soft') || (this.presentationComponents.length > 0 && this.resetConfig.presentationComponentsType === 'soft');
  }

  /**
   * Returns whether the page can be reloaded
   * @returns {boolean}
   */
  get canReload() {
    const pageId = this.model.findAncestor('page')?.get('_id');
    const locationId = Location._currentId;
    return (pageId === locationId);
  }

  /**
   * Returns whether the model is optional
   * @returns {boolean}
   */
  get isOptional() {
    return this.model.get('_isOptional');
  }

  /**
   * Returns whether all models have been completed in the last attempt
   * @returns {boolean}
   */
  get isAttemptComplete() {
    if (this.isAwaitingChildren) return false;
    return this.models.every(model => model.get('_isInteractionComplete'));
  }

  /**
   * Returns whether the assessment is completed.
   * A previously completed assessment which has been "soft" reset, will be deemed completed when not in session.
   * When an attempt is currently in session, it will return that attempt value for use in `ScoringSet.update`.
   * @override
   * @returns {boolean}
   */
  get isComplete() {
    if (this.isAwaitingChildren) return false;
    if (this.attempt?.isInSession) {
      return this.isAttemptComplete;
    } else if (this.hasSoftReset) {
      return this.attempts.wasComplete;
    }
    return this.models.every(model => model.get('_isComplete'));
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
    if (!this.attempt?.isInSession && this.hasSoftReset) return this.attempts.wasPassed;
    const isScaled = this.passmark.isScaled;
    const score = (isScaled) ? this.scaledScore : this.score;
    const correctness = (isScaled) ? this.scaledCorrectness : this.correctness;
    const isPassed = score >= this.passmark.score && correctness >= this.passmark.correctness;
    return isPassed;
  }

  /**
   * Returns the state to save to offlineStorage
   * @returns {Array}
   */
  get saveState() {
    return [
      this.attempts.saveState,
      this.attempt.saveState
    ];
  }

  /**
   * @listens AdaptModel#change:_isComplete
   */
  onModelIsCompleteChange() {
    // if associated model has been reset, reset the assessment
    if (!this.model.get('_isComplete') && this.canReset) this.reset();
  }

  /**
   * @param {Object} location
   * @listens Adapt#router:location
   */
  async onRouterLocation(location) {
    if (this.attempt) this.attempt.isInSession = false;
    if (location._contentType !== 'page') return;
    const model = location._currentModel;
    if (!hasIntersectingHierarchy([model], this.models)) return;
    if (this.shouldResetOnRevisit) await this.reset();
    this._hasReset = false;
    if (!this.isAttemptComplete) {
      this.attempt.start();
      this.save();
    }
  }

  /**
   * @extends
   * @fires Adapt#assessments:complete
   * @fires Adapt#scoring:assessment:complete
   */
  onCompleted() {
    if (this.attempt.isInProgress) {
      this.attempt.end();
      this.attempts.spend();
      this.attempts.record(this.attempt);
      this.save();
    }
    if (this.marking.isEnabled && this.marking.isSuppressed && !this.attempts.hasRemaining) {
      this._overrideQuestionConfiguration();
      this.questions.forEach(model => model.refresh());
    }
    if (this._isBackwardCompatible) Adapt.trigger('assessments:complete', this._compatibilityState, this.model);
    super.onCompleted();
  }

}
