let raffleData = [];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 10000;
const MAX_FIELD_LENGTH = 200;
const PRIVACY_KEY = 'rifa_privacy_accepted';

const uploadSection = document.getElementById('uploadSection');
const dataSection = document.getElementById('dataSection');
const drawSection = document.getElementById('drawSection');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadTitle = document.getElementById('uploadTitle');
const tableBody = document.getElementById('tableBody');
const btnSortear = document.getElementById('btnSortear');
const btnNewFile = document.getElementById('btnNewFile');
const btnSortearAgain = document.getElementById('btnSortearAgain');
const btnCloseWinner = document.getElementById('btnCloseWinner');
const drawAnimation = document.getElementById('drawAnimation');
const winnerCard = document.getElementById('winnerCard');
const slotNumber = document.getElementById('slotNumber');
const privacyCheckbox = document.getElementById('privacyCheckbox');
const toast = document.getElementById('toast');

const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv'];
const ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
  'text/csv',
  'text/plain',
  'application/csv',
]);

initPrivacyConsent();

uploadArea.addEventListener('dragover', (e) => {
  if (!isUploadEnabled()) return;
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (!isUploadEnabled()) {
    showToast('Aceite o aviso de privacidade antes de enviar um arquivo.');
    return;
  }
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

privacyCheckbox.addEventListener('change', updateUploadAvailability);

btnSortear.addEventListener('click', startDraw);
btnNewFile.addEventListener('click', resetApp);
btnSortearAgain.addEventListener('click', () => {
  winnerCard.classList.add('hidden');
  drawAnimation.classList.remove('hidden');
  startDraw();
});

btnCloseWinner.addEventListener('click', resetApp);

function initPrivacyConsent() {
  if (sessionStorage.getItem(PRIVACY_KEY) === '1') {
    privacyCheckbox.checked = true;
  }
  updateUploadAvailability();
}

function isUploadEnabled() {
  return privacyCheckbox.checked;
}

function updateUploadAvailability() {
  const enabled = isUploadEnabled();

  if (enabled) {
    sessionStorage.setItem(PRIVACY_KEY, '1');
  }

  fileInput.disabled = !enabled;
  uploadArea.classList.toggle('upload-area--disabled', !enabled);

  if (enabled) {
    uploadTitle.textContent = 'Arraste seu arquivo aqui';
  } else {
    uploadTitle.textContent = 'Aceite o aviso de privacidade para continuar';
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 4500);
}

function sanitizeField(value) {
  if (value == null) return null;
  const text = String(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
  if (!text) return null;
  return text.slice(0, MAX_FIELD_LENGTH);
}

function secureRandomIndex(max) {
  if (max <= 1) return 0;
  const range = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value;
  do {
    crypto.getRandomValues(range);
    value = range[0];
  } while (value >= limit);
  return value % max;
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase();
}

function validateFileMetadata(file) {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Formato não suportado. Use arquivos .xlsx, .xls ou .csv.';
  }

  if (file.size === 0) {
    return 'O arquivo está vazio.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Arquivo muito grande. O limite é 5 MB.';
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return 'Tipo de arquivo não permitido.';
  }

  return null;
}

function validateFileContent(buffer, ext) {
  const bytes = new Uint8Array(buffer);

  if (ext === 'csv') {
    if (bytes.includes(0)) {
      return 'Arquivo CSV inválido.';
    }
    return null;
  }

  if (ext === 'xlsx') {
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!isZip) {
      return 'Arquivo Excel (.xlsx) inválido.';
    }
    return null;
  }

  if (ext === 'xls') {
    const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
    if (!isOle) {
      return 'Arquivo Excel (.xls) inválido.';
    }
    return null;
  }

  return 'Formato não suportado.';
}

function resetApp() {
  raffleData = [];
  fileInput.value = '';
  uploadSection.classList.remove('hidden');
  dataSection.classList.add('hidden');
  drawSection.classList.add('hidden');
  document.getElementById('seoContent').classList.remove('hidden');
  winnerCard.classList.add('hidden');
  drawAnimation.classList.remove('hidden');
  clearTable();
  btnSortear.disabled = false;
}

function clearTable() {
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

function handleFile(file) {
  if (!isUploadEnabled()) {
    showToast('Aceite o aviso de privacidade antes de enviar um arquivo.');
    return;
  }

  const metadataError = validateFileMetadata(file);
  if (metadataError) {
    showToast(metadataError);
    fileInput.value = '';
    return;
  }

  const ext = getFileExtension(file.name);
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target.result;

      if (ext === 'csv') {
        const text = typeof content === 'string' ? content : new TextDecoder('utf-8').decode(content);
        const encoder = new TextEncoder();
        const contentError = validateFileContent(encoder.encode(text).buffer, ext);
        if (contentError) {
          showToast(contentError);
          return;
        }
        raffleData = parseCSV(text);
      } else {
        const contentError = validateFileContent(content, ext);
        if (contentError) {
          showToast(contentError);
          return;
        }
        raffleData = parseExcel(content);
      }

      if (raffleData.length === 0) {
        showToast('Nenhum número encontrado. Verifique se as colunas estão corretas.');
        return;
      }

      if (raffleData.length > MAX_ROWS) {
        showToast(`A planilha excede o limite de ${MAX_ROWS} números.`);
        raffleData = [];
        return;
      }

      renderTable();
      uploadSection.classList.add('hidden');
      document.getElementById('seoContent').classList.add('hidden');
      dataSection.classList.remove('hidden');
      drawSection.classList.add('hidden');
    } catch {
      showToast('Não foi possível ler o arquivo. Verifique o formato e tente novamente.');
    } finally {
      fileInput.value = '';
    }
  };

  reader.onerror = () => {
    showToast('Erro ao ler o arquivo. Tente novamente.');
    fileInput.value = '';
  };

  if (ext === 'csv') {
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.readAsArrayBuffer(file);
  }
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  return extractData(rows);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const rows = lines.map((line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  return extractData(rows);
}

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;

    const cells = row.map(normalizeHeader);
    const hasNumero = cells.some((c) => c.includes('numer') || c === 'n' || c === 'no');
    const hasComprador = cells.some((c) => c.includes('comprador') || c.includes('nome'));
    const hasContato = cells.some((c) => c.includes('contato') || c.includes('telefone') || c.includes('celular'));

    if (hasNumero && (hasComprador || hasContato)) {
      return i;
    }
  }
  return 0;
}

function extractData(rows) {
  const headerIdx = findHeaderRow(rows);
  const headers = (rows[headerIdx] || []).map(normalizeHeader);

  let numCol = headers.findIndex((h) => h.includes('numer') || h === 'n' || h === 'no');
  let buyerCol = headers.findIndex((h) => h.includes('comprador') || h.includes('nome'));
  let contactCol = headers.findIndex((h) => h.includes('contato') || h.includes('telefone') || h.includes('celular'));

  if (numCol === -1) numCol = 0;
  if (buyerCol === -1) buyerCol = 1;
  if (contactCol === -1) contactCol = 2;

  const data = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const numero = row[numCol];
    if (numero === null || numero === undefined || numero === '') continue;

    const parsedNum = parseInt(numero, 10);
    if (isNaN(parsedNum) || parsedNum < 0) continue;

    data.push({
      numero: parsedNum,
      comprador: sanitizeField(row[buyerCol]),
      contato: sanitizeField(row[contactCol]),
    });
  }

  return data.sort((a, b) => a.numero - b.numero);
}

function maskPhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 0) return '—';
  if (digits.length <= 4) return 'x'.repeat(digits.length);

  const showPattern = [true, true, false, false, true, true, false, true, true, false, false];
  let result = '';

  for (let i = 0; i < digits.length; i++) {
    if (i === digits.length - 1) {
      result += digits[i];
    } else if (i < showPattern.length) {
      result += showPattern[i] ? digits[i] : 'x';
    } else {
      result += 'x';
    }
  }

  return result;
}

function appendCell(row, className, text) {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = text;
  row.appendChild(cell);
}

function renderTable() {
  const sold = raffleData.filter((r) => r.comprador);
  const available = raffleData.filter((r) => !r.comprador);

  document.getElementById('totalNumbers').textContent = raffleData.length;
  document.getElementById('soldNumbers').textContent = sold.length;
  document.getElementById('availableNumbers').textContent = available.length;

  clearTable();

  const fragment = document.createDocumentFragment();

  for (const row of raffleData) {
    const tr = document.createElement('tr');
    if (!row.comprador) tr.className = 'empty-row';

    appendCell(tr, 'num-col', String(row.numero));
    appendCell(tr, '', row.comprador || 'Disponível');
    appendCell(tr, '', row.contato ? maskPhone(row.contato) : '—');

    fragment.appendChild(tr);
  }

  tableBody.appendChild(fragment);
}

function startDraw() {
  if (raffleData.length === 0) return;

  dataSection.classList.add('hidden');
  drawSection.classList.remove('hidden');
  winnerCard.classList.add('hidden');
  drawAnimation.classList.remove('hidden');

  btnSortear.disabled = true;

  const winnerIndex = secureRandomIndex(raffleData.length);
  const winner = raffleData[winnerIndex];
  const duration = 3000;
  const interval = 80;
  let elapsed = 0;

  const animInterval = setInterval(() => {
    const randomEntry = raffleData[secureRandomIndex(raffleData.length)];
    slotNumber.textContent = String(randomEntry.numero);
    slotNumber.classList.add('shake');
    setTimeout(() => slotNumber.classList.remove('shake'), 100);

    elapsed += interval;
    if (elapsed >= duration) {
      clearInterval(animInterval);
      showWinner(winner);
    }
  }, interval);
}

function showWinner(winner) {
  drawAnimation.classList.add('hidden');
  winnerCard.classList.remove('hidden');

  document.getElementById('winnerNumber').textContent = String(winner.numero);
  document.getElementById('winnerBuyer').textContent = winner.comprador || 'Número disponível (sem comprador)';
  document.getElementById('winnerContact').textContent = winner.contato ? maskPhone(winner.contato) : '—';

  launchConfetti();
  btnSortear.disabled = false;
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const colors = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${secureRandomIndex(10000) / 100}%`;
    piece.style.background = colors[secureRandomIndex(colors.length)];
    piece.style.animationDuration = `${2 + secureRandomIndex(2000) / 1000}s`;
    piece.style.animationDelay = `${secureRandomIndex(500) / 1000}s`;
    piece.style.borderRadius = secureRandomIndex(2) ? '50%' : '2px';
    const size = 6 + secureRandomIndex(800) / 100;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    container.appendChild(piece);
  }

  setTimeout(() => {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }, 4000);
}
