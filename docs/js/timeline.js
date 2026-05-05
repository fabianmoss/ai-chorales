// Timeline building functions for the experiment

// Build welcome screen
function buildWelcomeScreen() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<h1>Der musikalische Turing-Test</h1>
        <img src="ai-composer.png" style="height:400px">
        <p>Drücke eine beliebige Taste.</p>`
  };
}

// Build participant info surveys
function buildParticipantSurveys() {
  const surveys = [];

  // Age survey
  surveys.push({
    type: jsPsychSurveyText,
    questions: [
      {prompt: "Wie alt bist du?", name: "age", required: true}
    ],
    button_label: "Weiter"
  });

  // Musical experience
  surveys.push(createLikertSurvey(
    "Wie würdest du deine musikalische Erfahrung einschätzen?",
    "musical_experience"
  ));

  // Instrument, choir, AI usage
  surveys.push({
    type: jsPsychSurveyLikert,
    questions: [
      {prompt: "Spielst du ein Instrument?", labels: likertLabels["plays_instrument"], name: "plays_instrument", required: true},
      {prompt: "Singst du im Chor?", labels: likertLabels["sings_in_choir"], name: "sings_in_choir", required: true},
      {prompt: "Nutzt du KI mehrmals pro Woche?", labels: likertLabels["uses_ai_weekly"], name: "uses_ai_weekly", required: true}
    ],
    button_label: "Weiter"
  });

  // Confidence before
  surveys.push(createLikertSurvey(
    "Wie sicher bist du, dass du KI-Musik von echter Musik unterscheiden kannst?",
    "confidence_before"
  ));

  return surveys;
}

// Build instructions screen
function buildInstructions() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <h2>Willkommen bei unserem Experiment!</h2>
      <p>Du wird ein paar kurze Musikschnipsel mit Cembaloklang hören.</p>
      <p>Wenn du glaubst, dass es von einem <strong>Menschen</strong> komponiert wurde, drücke <strong>M</strong>.</p>
      <p>Wenn du glaubst, dass es von einer <strong>Künstlichen Intelligenz</strong> generiert wurde, drücke <strong>X</strong>.</p>
      <p>Antworte möglichst spontan, ohne viel nachzudenken.</p>
      <hr>
      <p>Zuerst kommt ein kurzer Test, um das Experiment kennenzulernen.</p>
      <p>Drücke die LEERTASTE, um fortzufahren.</p>`,
    post_trial_gap: 500
  };
}

// Build training phase
function buildTrainingPhase(training_trials) {
  const timeline = [];

  const training_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const last_trial = jsPsych.data.get().last(1).values()[0];
      return getTrainingFeedbackHtml(last_trial.correct_response);
    },
    choices: [" "],
    post_trial_gap: 500
  };

  training_trials.forEach(trial_info => {
    timeline.push({
      type: jsPsychAudioKeyboardResponse,
      stimulus: trial_info.file,
      choices: ["x", "m"],
      prompt: `<h2>Testphase</h2>
      <p>Wurde dies von einem Menschen (<strong>M</strong>) oder einer KI (<strong>X</strong>) komponiert?</p>
        <p>🧑‍🦰 ❔ 💻</p>`,
      data: { correct: trial_info.label, training: true, timestamp: timestamp },
      on_finish: function(data) {
        normalizeResponse(data);
        console.log(data.response, trial_info.label);
      }
    });
    timeline.push(training_feedback);
  });

  return timeline;
}

// Build audio trials
function buildAudioTrials(shuffled_files) {
  const timeline = [];

  for (let i = 0; i < shuffled_files.length; i++) {
    let trial_info = shuffled_files[i];
    timeline.push({
      type: jsPsychAudioKeyboardResponse,
      stimulus: trial_info.file,
      choices: ["x","m"],
      prompt: `
      <p>Wurde dies von einem Menschen (<strong>M</strong>) oder einer KI (<strong>X</strong>) komponiert?</p>
        <p>🧑‍🦰 ❔ 💻</p>
        <p style="margin-top:10px; font-weight:bold;">Versuch ${i+1} von ${shuffled_files.length}</p>`,
      data: function() {
        return {
          correct: trial_info.label,
          timestamp: timestamp,
          training: false
        };
      },
      on_finish: function(data) {
        normalizeResponse(data);
      },
      response_ends_trial: true,
      post_trial_gap: 500
    });
  }

  return timeline;
}

// Build feedback surveys
function buildFeedbackSurveys() {
  const surveys = [];

  // Free text feedback
  surveys.push({
    type: jsPsychSurveyText,
    questions: [{
      prompt: `<h2>Bevor wir zum Ergebnis kommen...</h2>
        <p>Wie fandest du die Aufgabe? Hast du Feedback für uns?</p>`,
      placeholder: "Deine Antwort…",
      rows: 5,
      columns: 80,
      required: true,
      name: "free_feedback"
    }],
    button_label: "Weiter"
  });

  // Difficulty
  surveys.push(createLikertSurvey(
    "Wie schwer fandest du das Experiment?",
    "difficulty"
  ));

  // Confidence after
  surveys.push(createLikertSurvey(
    "Wie sicher bist du, dass du KI-Musik von echter Musik unterscheiden kannst?",
    "confidence_after"
  ));

  return surveys;
}

// Build final screen
function buildFinalScreen() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    choices: ["§"],
    stimulus: function() {
      const trials = jsPsych.data.get()
        .filter({ trial_type: 'audio-keyboard-response', training: false })
        .values();
      return getResultsHtml(trials);
    },
    on_finish: function() {
      const allData = jsPsych.data.get().values();
      const participant_data = extractParticipantData(allData);

      const audioTrials = allData.filter(t =>
        t.trial_type === 'audio-keyboard-response'
      );

      const csv = generateCSV(audioTrials, participant_data);
      downloadCSV(csv, `results_${participant_id}.csv`);
    }
  };
}

// Main function to build the complete timeline
function buildTimeline(shuffled_files, training_trials) {
  const timeline = [];

  timeline.push(buildWelcomeScreen());
  timeline.push(...buildParticipantSurveys());
  timeline.push(buildInstructions());
  timeline.push(...buildTrainingPhase(training_trials));
  timeline.push(...buildAudioTrials(shuffled_files));
  timeline.push(...buildFeedbackSurveys());
  timeline.push(buildFinalScreen());

  return timeline;
}
