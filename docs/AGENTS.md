# AGENTS.md - AI Chorales Experiment Context

## Project Overview
**Experiment Name**: Der musikalische Turing-Test  
**Purpose**: jsPsych-based web experiment where participants distinguish between human-composed and AI-generated chorales. Collects survey data and trial responses, exports tidy CSV for pandas analysis.

**Location**: All experiment files in `/home/fmoss/GitHub/fabianmoss/ai-chorales/docs/`

## File Structure (Post-Refactoring)
```
docs/
├── AGENTS.md           # This file
├── index.html          # Clean HTML shell (21 lines, loads CSS/JS)
├── ai-composer.png    # Experiment image
├── data/              # Audio files (H/ = human, A/ = AI)
├── css/
│   └── style.css       # All styles (35 lines)
└── js/
    ├── config.js       # Audio lists, likert labels, CSV headers (65 lines)
    ├── utils.js        # Helpers (CSV gen, response normalization) + DEBUG LOGS
    ├── timeline.js     # Timeline building (surveys, trials, feedback)
    └── experiment.js   # jsPsych init and experiment start (41 lines)
```

## Completed Refactoring
1. **Split monolithic 488-line `index.html`** into modular CSS/JS files
2. **Single source of truth** for likert labels (`likertLabels` in `config.js`)
3. **Reusable helpers**: `normalizeResponse()`, `generateCSV()`, `downloadCSV()`
4. **Fixed free-text survey**: Removed `data: { trial_type: "free_text" }` override that broke survey detection

## Outstanding Issue
**CSV has empty participant survey fields**: Columns `age`, `musical_experience`, `plays_instrument`, `sings_in_choir`, `uses_ai_weekly`, `confidence_before`, `confidence_after`, `difficulty`, `free_feedback` are empty. Only trial columns (`stimulus`, `response`, `correct`, etc.) populate.

## Debug Context
### Debug Logs Added (in `js/utils.js`):
- `extractParticipantData()`: Logs all trial types, survey responses, parsed data, final `participant_data`
- `generateCSV()`: Logs `participant_data` and sample trial before CSV generation

### Likely Root Cause (from code review):
jsPsych survey plugins may return responses keyed by **question indices** (`Q0`, `Q1`) instead of the `name` property for multi-question surveys.

Example: The multi-question survey (instrument/choir/AI usage) may return:
```json
{ "Q0": 0, "Q1": 1, "Q2": 0 }
// Instead of: { "plays_instrument": 0, "sings_in_choir": 1, "uses_ai_weekly": 0 }
```

Current `extractParticipantData()` does not map `Q0`/`Q1` keys to actual question names.

## Next Steps for Next Agent
### Step 1: Capture Debug Logs
1. Start local server:
   ```bash
   cd /home/fmoss/GitHub/fabianmoss/ai-chorales/docs
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000` in browser, complete experiment (fake data OK)
3. Open DevTools (F12) → Console, copy all debug output

### Step 2: Confirm Response Format
Look for log: `"Parsed responses for trial X:"`
- If keys are `Q0`/`Q1` → proceed to Step 3
- If keys are actual names (`plays_instrument`) → investigate other parsing issues

### Step 3: Fix Response Mapping (if Q0/Q1 confirmed)
Add to `js/config.js`:
```javascript
const questionIndexMap = {
  "Q0": "plays_instrument",
  "Q1": "sings_in_choir",
  "Q2": "uses_ai_weekly"
};
```

Update `extractParticipantData()` in `js/utils.js` to map keys:
```javascript
Object.keys(responses).forEach(key => {
  let actualKey = key;
  if (key.startsWith("Q") && questionIndexMap.hasOwnProperty(key)) {
    actualKey = questionIndexMap[key];
  }
  // ... rest of processing
});
```

### Step 4: Verify & Clean Up
1. Re-run experiment, confirm CSV fields populate
2. Remove all debug logs from `utils.js`
3. Test CSV loads correctly in pandas:
   ```python
   import pandas as pd
   df = pd.read_csv("results_<participant_id>.csv")
   print(df.columns.tolist())  # Should show all expected columns
   ```

## Key Notes
- **Tidy format must be preserved**: One row per audio trial, participant data repeated across rows
- **Likert labels**: Single source in `config.js` (`likertLabels`) – used for both survey display and CSV text conversion
- **Response normalization**: `normalizeResponse()` in `utils.js` ensures `response` is always "m" or "x"

## Testing Checklist
- [ ] CSV has no empty participant columns
- [ ] Likert responses are text (e.g., "ja", "sehr erfahren") not indices
- [ ] `response` column only contains "m" or "x"
- [ ] `correct_response` is boolean (true/false)
- [ ] CSV loads without errors in pandas
