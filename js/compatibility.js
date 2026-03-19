import Adapt from 'core/js/adapt';
import Backbone from 'backbone';


export function setupBackwardCompatibility(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  assessmentSet.model.getState = () => compatibilityState(assessmentSet);
  assessmentSet.model.canResetInPage = () => assessmentSet.canReset && assessmentSet.canReload;
  const originalReset = assessmentSet.model.reset;
  assessmentSet.model.reset = (force, done) => {
    if (force === false) return;
    assessmentSet.reset().then(() => {
      typeof done === 'function' && done(true);
      originalReset.call(assessmentSet.model, assessmentSet.resetConfig._questionsType);
    });
  };
  const assessmentMock = {};
  Object.defineProperty(assessmentMock, '_isResetOnRevisit', {
    get: () => {
      // allow assessmentSet value to change, providing compatibility for assessmentResults
      return assessmentSet.shouldResetOnRevisit;
    }
  });
  assessmentSet.model.set('_assessment', assessmentMock);
}

export function compatibilityState(assessmentSet) {
  const state = {
    id: assessmentSet.config._id,
    type: 'article-assessment',
    pageId: assessmentSet.model.findAncestor('page')?.get('_id'),
    articleId: assessmentSet.model.get('_id'),
    isEnabled: assessmentSet.config._isEnabled,
    isComplete: assessmentSet.isComplete,
    isPercentageBased: assessmentSet.passmark.isScaled,
    scoreToPass: assessmentSet.passmark.score,
    score: assessmentSet.score,
    scoreAsPercent: assessmentSet.scaledScore,
    minScore: assessmentSet.minScore,
    maxScore: assessmentSet.maxScore,
    correctCount: assessmentSet.correctness,
    correctAsPercent: assessmentSet.scaledCorrectness,
    correctToPass: assessmentSet.passmark.correctness,
    questionCount: assessmentSet.availableQuestions.length,
    isPass: assessmentSet.isPassed,
    includeInTotalScore: assessmentSet.isScoreIncluded,
    assessmentWeight: 1,
    attempts: assessmentSet.attempts.isInfinite ? 'infinite' : assessmentSet.attempts.limit,
    attemptsSpent: assessmentSet.attempts.used,
    attemptsLeft: assessmentSet.attempts.isInfinite ? 'infinite' : assessmentSet.attempts.remaining,
    attemptInProgress: assessmentSet.attempt?.isInProgress,
    lastAttemptScoreAsPercent: assessmentSet.attempts?.last?.scaledScore ?? 0,
    questions: assessmentSet.availableQuestions.map(model => ({ _id: model.get('_id'), _isCorrect: model.get('_isCorrect') })),
    resetType: assessmentSet.resetConfig.questionsType,
    allowResetIfPassed: assessmentSet.resetConfig.passedConfig._canReset,
    questionModels: new Backbone.Collection(assessmentSet.availableQuestions)
  };
  return state;
}

export function triggerCompatibleComplete(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  Adapt.trigger('assessments:complete', compatibilityState(assessmentSet), assessmentSet.model);
}

export function triggerCompatibleRegister(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  Adapt.trigger('assessments:register', compatibilityState(assessmentSet), assessmentSet);
}

export function triggerCompatibleRestored(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  Adapt.trigger('assessments:restored', compatibilityState(assessmentSet), assessmentSet);
}

export function triggerCompatiblePreReset(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  Adapt.trigger('assessments:preReset', compatibilityState(assessmentSet), assessmentSet);
}
export function triggerCompatibleReset(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  Adapt.trigger('assessments:reset', compatibilityState(assessmentSet), assessmentSet);
}
export function triggerCompatiblePostReset(assessmentSet) {
  if (!assessmentSet._isBackwardCompatible) return;
  Adapt.trigger('assessments:postReset', compatibilityState(assessmentSet), assessmentSet);
}
