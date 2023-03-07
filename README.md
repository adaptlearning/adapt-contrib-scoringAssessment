# adapt-contrib-scoringAssessment

An extension attached to an article, used to assess child question components.

This plugin is a replacement for [adapt-contrib-assessment](https://github.com/adaptlearning/adapt-contrib-assessment), and has a dependency on [adapt-contrib-scoring](https://github.com/adaptlearning/adapt-contrib-scoring) to provide the Scoring API and scoring set logic. `Adapt.scoring` replaces `Adapt.assessment` as an API to collate an overall score and collection of scoring sets. An assessment is an extension of a scoring set.

Previous functionality has been refactored to split the logic into a series of plugins to handle specific behaviour, such as with [question banks](https://github.com/adaptlearning/adapt-contrib-banking) and [randomisation](https://github.com/adaptlearning/adapt-contrib-randomise). This allows the plugin to handle the core functionality, with other dependent plugins only included as required.

## Attributes

The attributes listed below are used in *articles.json* to configure the assessment, and are properly formatted as JSON in [*example.json*](https://github.com/adaptlearning/adapt-contrib-scoringAssessment/blob/master/example.json).

**\_isEnabled** (boolean): Determines whether this article is an assessment. The default is `false`.

**\_id** (string): Unique ID for this set. Referenced by other plugins when using the Scoring API.

**title** (string): A title for this set. Not required, but exposed should it be used for reporting purposes.

**_isScoreIncluded** (boolean): Determines whether the set should be included in the Scoring API score.

**_isCompletionRequired** (boolean): Determines whether the set should be included in the Scoring API completion.

**\_reset** (object): The settings used to configure resetting this assessment. Contains the following attributes:

 * **\_scrollTo** (boolean): Determines whether to scroll to this assessment when reset. The default is `false`.

 * **\_questionsType** (string): Determines whether the questions will remain completed when reset. A `"soft"` reset allows questions to be retaken, but the complete attribute remains set to true. A `"hard"` reset requires the question to be completed again. For `"soft"`, when using [trickle](https://github.com/adaptlearning/adapt-contrib-trickle), please set the trickle `_completionAttribute` to `"_isInteractionComplete"` The default is `"hard"`.

 * **\_presentationComponentsType** (string): Determines whether the presentation components will remain completed when reset. A `"soft"` reset allows questions to be retaken, but the complete attribute remains set to true. A `"hard"` reset requires the question to be completed again. For `"soft"`, when using [trickle](https://github.com/adaptlearning/adapt-contrib-trickle), please set the trickle `_completionAttribute` to `"_isInteractionComplete"` The default is `"soft"`.

 * **\_failed** (object): The reset settings to apply for a failed assessment. Contains the following attributes:

   * **\_isEnabled** (boolean): Determines whether the assessment can be reset. The default is `true`.

   * **\_isResetOnRevisit** (boolean): Determines whether the assessment resets automatically (up to the number of available attempts) when a user revisits the page. The default is `true`.

 * **\_passed** (object): The reset settings to apply for a passed assessment. Contains the following attributes:

   * **\_isEnabled** (boolean): Determines whether the assessment can be reset. The default is `true`.

   * **\_isResetOnRevisit** (boolean): Determines whether the assessment resets automatically (up to the number of available attempts) when a user revisits the page. The default is `false`.

**\_passmark** (object): The settings used to configure the passmark. Contains the following attributes:

 * **\_isEnabled** (boolean): Determines whether a passmark is required. The default is `true`.

 * **\_requiresPassedSubsets** (boolean): Determines whether all `_isScoreIncluded` scoring sets need to be passed. Used in conjunction with `_score` and `_correctness`. The default is `false`.

 * **\_score** (number): Determines the score required to pass. The default is `60`.

 * **\_correctness** (number): Determines the correctness required to pass The default is `60`.

 * **\_isScaled** (boolean): Determines whether `_score` and `_correctness` are to be used as raw or percentage values. The default is `true`.

**\_attempts** (object): The settings used to configure the assessment attempts. Contains the following attributes:

 * **\_limit** (number): Determines the number of attempts the user is allowed to complete this assessment. Set to -1 (or 0) to allow infinite attempts. The default is `-1`.

 * **\_shouldStoreAttempts** (boolean): Determines whether the history of all attempts is retained across browser sessions. Requires a suitable tracking plugin to be used. The default is `false`.

**\_questions** (object): The settings used to configure the assessment questions. Contains the following attributes:

 * **\_canShowFeedback** (boolean): Allows the user to view feedback on their answer. The default is `false`.

 * **\_canShowMarking** (boolean): Displays ticks and crosses on question completion. The default is `false`.

 * **\_canShowModelAnswer** (boolean): Allows the user to view the 'model answer' should they answer the question incorrectly. The default is `false`.

**\_suppressMarking** (boolean): Determines whether question marking should be delayed until completion of the assessment or until all attempts have been exhausted. The default is `true`.

## Events

The following events are triggered:

**Adapt#scoring:assessment:register**<br>
**Adapt#scoring:assessment:restored**<br>
**Adapt#scoring:assessment:complete**<br>
**Adapt#scoring:assessment:passed**<br>
**Adapt#scoring:assessment:preReset**<br>
**Adapt#scoring:assessment:reset**<br>
**Adapt#scoring:assessment:postReset**

For backward compatibility the following events are triggered if [**adapt-contrib-scoring**](https://github.com/adaptlearning/adapt-contrib-scoring) `"_isBackwardCompatible": true`:

**Adapt#assessments:register**<br>
**Adapt#assessments:restored**<br>
**Adapt#assessments:complete**<br>
**Adapt#assessments:preReset**<br>
**Adapt#assessments:reset**<br>
**Adapt#assessments:postReset**

----------------------------
**Version number:** 0.0.1 (pre-release)<br>
**Framework versions:** will require a framework update for tracking.js (add version following release)<br>
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-scoringAssessment/graphs/contributors)<br>
**Plugin dependenies:** [adapt-contrib-scoring](https://github.com/adaptlearning/adapt-contrib-scoring): ">=0.0.1"
