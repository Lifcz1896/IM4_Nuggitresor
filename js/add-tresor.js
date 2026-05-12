// add-tresor.js
const ANIMALS = [
  { emoji: '🐻', name: 'Bruno',   bg: 'linear-gradient(145deg, #8B5E3C, #C4936A)' },
  { emoji: '🐰', name: 'Hoppel', bg: 'linear-gradient(145deg, #C4688A, #EFA0BC)' },
  { emoji: '🦊', name: 'Foxy',   bg: 'linear-gradient(145deg, #D4621A, #F5A040)' },
  { emoji: '🐼', name: 'Panda',  bg: 'linear-gradient(145deg, #3D4F60, #6A8298)' },
  { emoji: '🦁', name: 'Leo',    bg: 'linear-gradient(145deg, #B8720E, #E8B830)' },
  { emoji: '🐯', name: 'Tiger',  bg: 'linear-gradient(145deg, #C24A10, #E88030)' },
  { emoji: '🐸', name: 'Frosch', bg: 'linear-gradient(145deg, #2E7D32, #5CB85C)' },
  { emoji: '🦄', name: 'Unicorn',bg: 'linear-gradient(145deg, #7B2D8B, #C070D0)' },
  { emoji: '🐨', name: 'Koala',  bg: 'linear-gradient(145deg, #4A6170, #8AAABB)' },
  { emoji: '🦉', name: 'Eule',   bg: 'linear-gradient(145deg, #3D5C38, #6A9A62)' },
  { emoji: '🐧', name: 'Pinguin',bg: 'linear-gradient(145deg, #1A3F80, #3A70B8)' },
  { emoji: '🦒', name: 'Giraffe',bg: 'linear-gradient(145deg, #A07010, #CDA030)' },
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
  <div class="animal-card" data-emoji="${a.emoji}" style="background:${a.bg}" onclick="selectAnimal(this, '${a.emoji}')">
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
      showToast(result.message || 'Fehler beim Erstellen');
      btn.disabled = false;
      btn.textContent = 'Ziel speichern';
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Etwas ist schiefgelaufen!');
    btn.disabled = false;
    btn.textContent = 'Ziel speichern';
  }
});
