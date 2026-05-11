// add-tresor.js
const ANIMALS = [
  { emoji: '🐻', name: 'Bruno' },
  { emoji: '🐰', name: 'Hoppel' },
  { emoji: '🦊', name: 'Foxy' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🦁', name: 'Leo' },
  { emoji: '🐯', name: 'Tiger' },
  { emoji: '🐸', name: 'Frosch' },
  { emoji: '🦄', name: 'Unicorn' },
  { emoji: '🐨', name: 'Koala' },
  { emoji: '🦉', name: 'Eule' },
  { emoji: '🐧', name: 'Pinguin' },
  { emoji: '🦒', name: 'Giraffe' },
];

let selectedEmoji = null;
let childName = '';

function showStep(n) {
  document.querySelectorAll('.step').forEach((s) => s.classList.add('hidden'));
  document.getElementById('step' + n).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Render animal grid
document.getElementById('animalGrid').innerHTML = ANIMALS.map(
  (a) => `
  <div class="animal-card" data-emoji="${a.emoji}" onclick="selectAnimal(this, '${a.emoji}')">
    <span class="animal-emoji">${a.emoji}</span>
    <span class="animal-name">${a.name}</span>
  </div>`
).join('');

function selectAnimal(el, emoji) {
  document.querySelectorAll('.animal-card').forEach((c) => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedEmoji = emoji;
  document.getElementById('toStep3Btn').disabled = false;
}

// Step 1 → 2
document.getElementById('toStep2Btn').addEventListener('click', () => {
  const name = document.getElementById('childName').value.trim();
  if (!name) {
    document.getElementById('childName').focus();
    return;
  }
  childName = name;
  document.getElementById('avatarSubtitle').textContent = `Dieser beschützt ${name}'s Nuggi`;
  showStep(2);
});

document.getElementById('childName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('toStep2Btn').click();
});

// Step 2 → 3
document.getElementById('toStep3Btn').addEventListener('click', () => {
  document.getElementById('selectedAvatar').textContent = selectedEmoji;
  showStep(3);
});

// Sliders
function updateTime() {
  const h = parseInt(document.getElementById('hoursSlider').value);
  const m = parseInt(document.getElementById('minutesSlider').value);
  document.getElementById('hLabel').textContent = h + 'h';
  document.getElementById('mLabel').textContent = m + 'm';
  document.getElementById('timeDisplay').textContent =
    `${h}:${m.toString().padStart(2, '0')}`;
}

document.getElementById('hoursSlider').addEventListener('input', updateTime);
document.getElementById('minutesSlider').addEventListener('input', updateTime);

// Save tresor
document.getElementById('saveTresorBtn').addEventListener('click', async () => {
  const h = parseInt(document.getElementById('hoursSlider').value);
  const m = parseInt(document.getElementById('minutesSlider').value);
  const goalMinutes = h * 60 + m;

  const btn = document.getElementById('saveTresorBtn');
  btn.disabled = true;
  btn.textContent = 'Wird gespeichert…';

  try {
    const response = await fetch('api/add-tresor.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: childName, emoji: selectedEmoji, goal_minutes: goalMinutes }),
    });
    const result = await response.json();
    if (result.status === 'success') {
      window.location.href = 'dashboard.html';
    } else {
      alert(result.message || 'Fehler beim Erstellen');
      btn.disabled = false;
      btn.textContent = 'Ziel speichern';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Etwas ist schiefgelaufen!');
    btn.disabled = false;
    btn.textContent = 'Ziel speichern';
  }
});
