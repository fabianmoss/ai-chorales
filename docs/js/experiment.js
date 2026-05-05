// Main experiment initialization and execution

// SETUP
// --- Initialize jsPsych ---
var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
var participant_id = crypto.randomUUID();

var jsPsych = initJsPsych({
  on_finish: function() {
    // debug output
    console.table(
      jsPsych.data.get()
        .filter({ trial_type: 'audio-keyboard-response' })
        .select(['stimulus', 'response', 'correct', 'participant_id', 'rt'])
        .values()
    );
  }
});

jsPsych.data.addProperties({ participant_id: participant_id });

// --- Audio files ---
var audio_files = buildAudioFiles();

// Shuffle
var shuffled_files = jsPsych.randomization.shuffle(audio_files);

var human_pool = shuffled_files.filter(f => f.label === "m");
var ai_pool = shuffled_files.filter(f => f.label === "x");

const training_human = jsPsych.randomization.sampleWithoutReplacement(human_pool, 1)[0];
const training_ai = jsPsych.randomization.sampleWithoutReplacement(ai_pool, 1)[0];

const training_trials = jsPsych.randomization.shuffle([training_human, training_ai]);
shuffled_files = shuffled_files.filter(f => f !== training_human && f !== training_ai);

// EXPERIMENT
var timeline = buildTimeline(shuffled_files, training_trials);

// Start the experiment
jsPsych.run(timeline);
