import Adapt from 'core/js/adapt';
import Data from 'core/js/data';
import AssessmentSet from './AssessmentSet';
import Scoring from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

class ScoringAssessment extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'app:dataReady', this.onAppDataReady);
  }

  onAppDataReady() {
    const isBackwardCompatible = Scoring.isBackwardCompatible;
    const models = Data.filter(model => model.get('_scoringAssessment')?._isEnabled);
    models.forEach(model => new AssessmentSet({ model, _isBackwardCompatible: isBackwardCompatible }));
  }

}

export default new ScoringAssessment();
