const slider = document.getElementById('speedSlider');
const label = document.getElementById('valueLabel');
const presetsContainer = document.getElementById('presetsContainer');
const newPresetInput = document.getElementById('newPresetInput');
const addPresetBtn = document.getElementById('addPresetBtn');
const errorMessage = document.getElementById('errorMessage');
const resetPresetsBtn = document.getElementById('resetPresetsBtn');

const defaultPresets = [10, 25, 75, 100, 200, 300, 500, 1000, 1600];
const minLog = Math.log10(10);
const maxLog = Math.log10(1600);

function linearToLogValue(linearValue) {
  const logValue = minLog + (linearValue / 100) * (maxLog - minLog);
  return Math.pow(10, logValue);
}

function logValueToLinear(logValue) {
  const logPercent = (Math.log10(logValue) - minLog) / (maxLog - minLog);
  return logPercent * 100;
}

function updateLabelAndSave(percent) {
  const rounded = Math.round(percent / 5) * 5;
  label.textContent = `${rounded}%`;
  localStorage.setItem('videoSpeedPercent', rounded);
  chrome.runtime.sendMessage({ type: 'setSpeed', speed: rounded / 100 });
  highlightPreset(rounded);
}

slider.addEventListener('input', () => {
  const percent = linearToLogValue(parseFloat(slider.value));
  updateLabelAndSave(percent);
});

slider.addEventListener('change', () => {
  const percent = linearToLogValue(parseFloat(slider.value));
  updateLabelAndSave(percent);
});

function loadPresets() {
  const saved = localStorage.getItem('presets');
  return saved ? JSON.parse(saved) : [...defaultPresets];
}

function savePresets(presets) {
  localStorage.setItem('presets', JSON.stringify(presets));
}

function renderPresets() {
  presetsContainer.innerHTML = '';
  const presets = loadPresets();
  presets.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = `${val}%`;
    btn.setAttribute('data-val', val);

    btn.addEventListener('click', () => {
      const linear = logValueToLinear(val);
      slider.value = linear;
      updateLabelAndSave(val);
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (confirm(`Remove preset ${val}%?`)) {
        const updated = loadPresets().filter(p => p !== val);
        savePresets(updated);
        renderPresets();
      }
    });

    presetsContainer.appendChild(btn);
  });
}

function highlightPreset(currentPercent) {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.getAttribute('data-val')) === currentPercent);
  });
}

function showError(msg) {
  errorMessage.textContent = msg;
  setTimeout(() => (errorMessage.textContent = ''), 3000);
}

function tryAddPreset() {
  let val = parseInt(newPresetInput.value);
  if (isNaN(val)) return;

  val = Math.round(val / 5) * 5;

  if (val < 10 || val > 1600) {
    showError('Value must be between 10 and 1600');
    return;
  }

  const presets = loadPresets();
  if (!presets.includes(val)) {
    presets.push(val);
    presets.sort((a, b) => a - b);
    savePresets(presets);
    renderPresets();
  }

  newPresetInput.value = '';
}

addPresetBtn.addEventListener('click', tryAddPreset);
newPresetInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryAddPreset();
});

resetPresetsBtn.addEventListener('click', () => {
  if (confirm('Reset presets to default?')) {
    savePresets([...defaultPresets]);
    renderPresets();
  }
});

// Init
const saved = localStorage.getItem('videoSpeedPercent');
const start = saved ? parseInt(saved) : 300;
slider.value = logValueToLinear(start);
label.textContent = `${start}%`;
highlightPreset(start);
renderPresets();