// Configuration: Audio files and survey labels
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyL7sK7yRD_Lpt5YTvDpHUMTX3IH7MwVnvlyZW56JQbr4TZr6DiqOrsRgQasU2R29rp/exec";
// Likert labels - single source of truth for both survey display and CSV conversion
const likertLabels = {
  musical_experience: ["sehr unerfahren", "unerfahren", "erfahren", "sehr erfahren"],
  plays_instrument: ["ja", "nein"],
  sings_in_choir: ["ja", "nein"],
  uses_ai_weekly: ["ja", "nein"],
  confidence_before: ["sehr unsicher", "unsicher", "sicher", "sehr sicher"],
  difficulty: ["sehr einfach", "einfach", "schwer", "sehr schwer"],
  confidence_after: ["sehr unsicher", "unsicher", "sicher", "sehr sicher"]
};

// Audio files configuration
const human_files = [
  "data/H/122.6-4.wav",
  "data/H/148.6-6.wav",
  "data/H/153.5-3.wav",
  "data/H/175.5-5.wav",
  "data/H/227.11-5.wav",
  "data/H/244.15-6.wav",
  "data/H/256-5.wav",
  "data/H/276-8.wav",
  "data/H/283-7.wav",
  "data/H/290-2.wav",
  "data/H/292-2.wav",
  // "data/H/294-4.wav",
  // "data/H/325-5.wav",
  // "data/H/368-7.wav",
  // "data/H/375-1.wav",
  // "data/H/402-8.wav",
  // "data/H/426-6.wav",
  // "data/H/428-3.wav",
  // "data/H/5.7-2.wav",
  // "data/H/65.7-5.wav",
  // "data/H/90.5-6.wav",
];

const ai_files = [
  "data/A/output10-6.wav",
  "data/A/output14-6.wav",
  "data/A/output48-2.wav",
  "data/A/output16-1.wav",
  "data/A/output19-1.wav",
  "data/A/output21-1.wav",
  "data/A/output26-4.wav",
  "data/A/output28-2.wav",
  "data/A/output3-3.wav",
  "data/A/output31-5.wav",
  "data/A/output39-6.wav",
  // "data/A/output58-3.wav",
  // "data/A/output61-3.wav",
  // "data/A/output64-3.wav",
  // "data/A/output67-3.wav",
  // "data/A/output70-1.wav",
  // "data/A/output75-1.wav",
  // "data/A/output77-3.wav",
  // "data/A/output79-3.wav",
  // "data/A/output80-2.wav",
  // "data/A/output81-3.wav",
];

// Build audio files array with labels
function buildAudioFiles() {
  const audio_files = [];
  human_files.forEach(f => audio_files.push({file: f, label: "m"}));
  ai_files.forEach(f => audio_files.push({file: f, label: "x"}));
  return audio_files;
}

// CSV headers - single source of truth
const csvHeaders = [
  'participant_id', 'timestamp', 'age', 'musical_experience', 'plays_instrument',
  'sings_in_choir', 'uses_ai_weekly', 'confidence_before',
  'confidence_after', 'difficulty', 'free_feedback',
  'stimulus', 'response', 'correct', 'correct_response', 'rt', 'training'
];
