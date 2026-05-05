// Utility functions for the experiment

// Normalize response to lowercase
function normalizeResponse(data) {
  data.response = data.response?.toLowerCase();
  data.correct_response = data.response === data.correct;
}

// Escape CSV values properly
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Convert likert index to text label
function likertIndexToLabel(key, idx) {
  // Convert idx to number in case it's a string
  const numIdx = typeof idx === 'string' ? parseInt(idx, 10) : idx;
  if (likertLabels.hasOwnProperty(key) && likertLabels[key][numIdx] !== undefined) {
    return likertLabels[key][numIdx];
  }
  return idx;
}

// Extract participant data from survey responses
function extractParticipantData(allData) {
  const participant_data = {};

  // Get participant_id from trial data (added via jsPsych.data.addProperties)
  // Check multiple sources
  if (allData.length > 0) {
    // Try to get from first trial's data properties
    const firstTrial = allData[0];
    if (firstTrial.participant_id) {
      participant_data.participant_id = firstTrial.participant_id;
    }
  }

  // Fallback to global variable
  if (!participant_data.participant_id && typeof participant_id !== 'undefined') {
    participant_data.participant_id = participant_id;
  }

  console.log("=== extractParticipantData DEBUG ===");
  console.log("Total trials in allData:", allData.length);
  console.log("participant_id from global:", typeof participant_id !== 'undefined' ? participant_id : 'undefined');

  // Log ALL trial data for debugging
  allData.forEach((trial, i) => {
    console.log(`Trial ${i + 1}: type=${trial.trial_type}, has_response=${!!trial.response}`);
    if (trial.response) {
      console.log(`  response raw:`, trial.response);
    }
  });

  // Filter survey trials - check all possible trial types
  const surveyTrials = allData.filter(t => {
    const isSurvey = t.trial_type === 'survey-text' ||
                     t.trial_type === 'survey-likert' ||
                     t.trial_type === 'survey-multi-choice' ||
                     t.trial_type === 'survey';
    if (isSurvey) {
      console.log(`Found survey trial: type=${t.trial_type}, response=`, t.response);
    }
    return isSurvey;
  });

  console.log("Number of survey trials found:", surveyTrials.length);

  surveyTrials.forEach((trial, i) => {
    console.log(`Processing survey trial ${i + 1}:`, {
      type: trial.trial_type,
      response: trial.response,
      responseType: typeof trial.response
    });

    if (!trial.response) {
      console.warn(`Survey trial ${i + 1} has no response`);
      // Try to get response from other properties
      console.log(`Trial data keys:`, Object.keys(trial));
      return;
    }

    try {
      // Handle both string and object responses
      let responses;
      if (typeof trial.response === 'string') {
        try {
          responses = JSON.parse(trial.response);
        } catch (e) {
          console.warn('JSON parse failed, using raw string:', trial.response);
          responses = { raw: trial.response };
        }
      } else {
        responses = trial.response;
      }

      console.log(`Parsed responses for trial ${i + 1}:`, responses);

      // Handle different response formats
      if (typeof responses === 'object' && responses !== null) {
        Object.keys(responses).forEach(key => {
          const value = responses[key];
          if (trial.trial_type === 'survey-likert' && likertLabels.hasOwnProperty(key)) {
            participant_data[key] = likertIndexToLabel(key, value);
          } else {
            participant_data[key] = value;
          }
          console.log(`Set participant_data["${key}"] =`, participant_data[key]);
        });
      } else {
        console.warn('Responses is not an object:', responses);
      }
    } catch (e) {
      console.warn('Failed to process survey response:', trial.response, e);
    }
  });

  console.log("Final participant_data:", participant_data);
  console.log("participant_data keys:", Object.keys(participant_data));
  console.log("=== END DEBUG ===");
  return participant_data;
}

// Build confusion matrix from trials
function buildConfusionMatrix(trials) {
  return {
    mm: trials.filter(t => t.correct === "m" && t.response === "m").length,
    mx: trials.filter(t => t.correct === "m" && t.response === "x").length,
    xm: trials.filter(t => t.correct === "x" && t.response === "m").length,
    xx: trials.filter(t => t.correct === "x" && t.response === "x").length
  };
}

// Generate CSV from audio trials and participant data
function generateCSV(audioTrials, participant_data) {
  console.log("CSV participant_data:", participant_data);
  console.log("Sample trial:", audioTrials[0]);

  const rows = audioTrials.map(trial => {
    return csvHeaders.map(h => {
      if (h in participant_data) return escapeCSV(participant_data[h]);
      if (h in trial) return escapeCSV(trial[h]);
      return '';
    }).join(',');
  });

  return [csvHeaders.join(','), ...rows].join('\n');
}

// Download CSV file
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Create training feedback HTML
function getTrainingFeedbackHtml(isCorrect) {
  if (isCorrect) {
    return `<h2 style='color:green;'>Richtig!</h2>
      <p>Jetzt weißt du, wie es funktioniert.</p>
      <p>Drücke die LEERTASTE, um fortzufahren.</p>`;
  } else {
    return `<h2 style='color:red;'>Leider nicht korrekt.</h2>
      <p>Aber jetzt weißt du, wie es funktioniert.</p>
      <p>Drücke die LEERTASTE, um fortzufahren.</p>`;
  }
}

// Create results HTML with confusion matrix
function getResultsHtml(trials) {
  const total = trials.length;
  const matrix = buildConfusionMatrix(trials);
  const correct = matrix.mm + matrix.xx;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return `
    <h2>Vielen Dank für die Teilnahme!</h2>
    <p><strong>Deine Trefferquote:</strong> ${correct} / ${total} (${accuracy}%)</p>
    <table class="results-table">
      <tr>
        <th></th>
        <th></th>
        <th colspan="2">Deine Antwort</th>
      </tr>
      <tr>
        <th></th>
        <th></th>
        <th>🧑‍🦰 Mensch</th>
        <th>💻 KI</th>
      </tr>
      <tr>
        <th rowspan="2" class="vertical-header">Korrekte Antwort</th>
        <th>🧑‍🦰 Mensch</th>
        <td class="correct">${matrix.mm}</td>
        <td class="incorrect">${matrix.mx}</td>
      </tr>
      <tr>
        <th>💻 KI</th>
        <td class="incorrect">${matrix.xm}</td>
        <td class="correct">${matrix.xx}</td>
      </tr>
    </table>
    <p>Bitte sage Bescheid, dass du fertig bist.</p>
  `;
}

// Create likert survey helper
function createLikertSurvey(prompt, name, button_label = "Weiter") {
  return {
    type: jsPsychSurveyLikert,
    questions: [{
      prompt: prompt,
      labels: likertLabels[name],
      name: name,
      required: true
    }],
    button_label: button_label
  };
}
