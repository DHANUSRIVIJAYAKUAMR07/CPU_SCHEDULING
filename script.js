// ===== PROCESS COLORS =====
const COLORS = [
  '#00d4ff','#ff6b35','#7c3aed','#00ff88',
  '#ffd700','#ff4488','#00bfff','#ff9900',
  '#e040fb','#69f0ae'
];

// ===== STATE =====
const state = {
  fcfs:     { processes: [], nextId: 1 },
  sjf:      { processes: [], nextId: 1 },
  priority: { processes: [], nextId: 1 },
  rr:       { processes: [], nextId: 1 },
};

// ===== NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const navEl = document.getElementById('nav-' + id);
  if (navEl) navEl.classList.add('active');
  window.scrollTo(0, 0);
}

// ===== ADD / DELETE PROCESS =====
function addProcess(algo) {
  const s = state[algo];
  const id = s.nextId++;
  const p = { id, arrival: 0, burst: 1, priority: 1 };
  s.processes.push(p);
  renderTable(algo);
}

function deleteProcess(algo, id) {
  state[algo].processes = state[algo].processes.filter(p => p.id !== id);
  renderTable(algo);
}

function renderTable(algo) {
  const tbody = document.getElementById(algo + '-tbody');
  const hasPriority = algo === 'priority';
  tbody.innerHTML = '';

  state[algo].processes.forEach((p, i) => {
    const color = COLORS[i % COLORS.length];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="pid-cell" style="color:${color}">P${p.id}</td>
      <td><input type="number" min="0" value="${p.arrival}"
          oninput="updateProcess('${algo}',${p.id},'arrival',this.value)"></td>
      <td><input type="number" min="1" value="${p.burst}"
          oninput="updateProcess('${algo}',${p.id},'burst',this.value)"></td>
      ${hasPriority
        ? `<td><input type="number" min="1" value="${p.priority}"
               oninput="updateProcess('${algo}',${p.id},'priority',this.value)"></td>`
        : ''}
      <td><button class="delete-btn" onclick="deleteProcess('${algo}',${p.id})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateProcess(algo, id, field, val) {
  const p = state[algo].processes.find(p => p.id === id);
  if (p) p[field] = Math.max(field === 'burst' ? 1 : 0, parseInt(val) || 0);
}

// ===== RESET =====
function resetSim(algo) {
  state[algo].processes = [];
  state[algo].nextId = 1;
  renderTable(algo);
  document.getElementById(algo + '-output').innerHTML =
    '<div class="output-empty"><div class="empty-icon">⬡</div>' +
    '<p>Configure processes and run simulation</p></div>';
}

// ===== LOAD EXAMPLES =====
const examples = {
  fcfs: [
    { id:1, arrival:0, burst:5, priority:1 },
    { id:2, arrival:1, burst:3, priority:2 },
    { id:3, arrival:2, burst:8, priority:1 },
    { id:4, arrival:3, burst:2, priority:3 },
  ],
  sjf: [
    { id:1, arrival:0, burst:6, priority:1 },
    { id:2, arrival:1, burst:2, priority:2 },
    { id:3, arrival:2, burst:8, priority:1 },
    { id:4, arrival:3, burst:3, priority:3 },
  ],
  priority: [
    { id:1, arrival:0, burst:4, priority:2 },
    { id:2, arrival:1, burst:3, priority:1 },
    { id:3, arrival:2, burst:5, priority:3 },
    { id:4, arrival:3, burst:2, priority:2 },
  ],
  rr: [
    { id:1, arrival:0, burst:5, priority:1 },
    { id:2, arrival:1, burst:3, priority:1 },
    { id:3, arrival:2, burst:7, priority:1 },
    { id:4, arrival:4, burst:2, priority:1 },
  ],
};

function loadExample(algo) {
  state[algo].processes = examples[algo].map(p => ({ ...p }));
  state[algo].nextId = examples[algo].length + 1;
  renderTable(algo);
}

// ===== RENDER OUTPUT =====
function renderOutput(algo, gantt, results, accentColor) {
  const totalTime = gantt[gantt.length - 1].end;
  const avgWait = (results.reduce((a, r) => a + r.wait, 0) / results.length).toFixed(2);
  const avgTurn = (results.reduce((a, r) => a + r.turnaround, 0) / results.length).toFixed(2);
  const cpuUtil = (
    (gantt
      .filter(g => g.pid !== 'IDLE')
      .reduce((a, g) => a + g.end - g.start, 0) /
      totalTime) * 100
  ).toFixed(1);

  // Gantt HTML
  let ganttHTML = '';
  let timeHTML  = '';
  const usedTimes = new Set();

  gantt.forEach(block => {
    const width = ((block.end - block.start) / totalTime * 100).toFixed(2);
    const color = block.pid === 'IDLE'
      ? null
      : COLORS[results.findIndex(r => r.pid === block.pid) % COLORS.length];
    const style = color
      ? `background:${color}; width:${width}%`
      : `width:${width}%`;
    const label = block.pid === 'IDLE' ? 'IDLE' : block.pid;
    ganttHTML += `<div class="gantt-block ${block.pid === 'IDLE' ? 'idle' : ''}"
      style="${style}"
      title="${label} [${block.start}–${block.end}]">
      ${width > 3 ? label : ''}
    </div>`;

    [block.start, block.end].forEach(t => {
      if (!usedTimes.has(t)) {
        usedTimes.add(t);
        timeHTML += `<div class="timeline-tick"
          style="left:${(t / totalTime * 100).toFixed(2)}%">${t}</div>`;
      }
    });
  });

  // Results rows
  const hasPriority = results[0]?.priority !== undefined;
  let rowsHTML = '';

  results.forEach((r, i) => {
    const color = COLORS[i % COLORS.length];
    rowsHTML += `
      <tr>
        <td class="pid" style="color:${color}">${r.pid}</td>
        <td>${r.arrival}</td>
        <td>${r.burst}</td>
        ${hasPriority ? `<td>${r.priority}</td>` : ''}
        <td>${r.completion}</td>
        <td class="good-val">${r.turnaround}</td>
        <td class="${r.wait > avgWait ? 'bad-val' : 'good-val'}">${r.wait}</td>
      </tr>`;
  });

  document.getElementById(algo + '-output').innerHTML = `
    <div class="result-appear">
      <div class="metrics-row">
        <div class="metric">
          <div class="metric-val">${avgWait}</div>
          <div class="metric-label">Avg Wait Time</div>
        </div>
        <div class="metric">
          <div class="metric-val">${avgTurn}</div>
          <div class="metric-label">Avg Turnaround</div>
        </div>
        <div class="metric">
          <div class="metric-val">${cpuUtil}%</div>
          <div class="metric-label">CPU Utilization</div>
        </div>
      </div>

      <div class="gantt-wrapper">
        <div class="gantt-title">Gantt Chart — Total Time: ${totalTime} units</div>
        <div class="gantt-chart">${ganttHTML}</div>
        <div class="gantt-timeline" style="position:relative;height:22px;">${timeHTML}</div>
      </div>

      <div class="results-table-wrap">
        <table class="results-table">
          <thead>
            <tr>
              <th>Process</th><th>Arrival</th><th>Burst</th>
              ${hasPriority ? '<th>Priority</th>' : ''}
              <th>Completion</th><th>Turnaround</th><th>Wait Time</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ===== FCFS =====
function runFCFS() {
  const procs = [...state.fcfs.processes];
  if (!procs.length) return alert('Add at least one process!');

  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  const gantt = [], results = [];
  let time = 0;

  sorted.forEach(p => {
    if (time < p.arrival) {
      gantt.push({ pid: 'IDLE', start: time, end: p.arrival });
      time = p.arrival;
    }
    const start = time;
    time += p.burst;
    gantt.push({ pid: 'P' + p.id, start, end: time });
    const turnaround = time - p.arrival;
    const wait = turnaround - p.burst;
    results.push({ pid: 'P' + p.id, arrival: p.arrival, burst: p.burst, completion: time, turnaround, wait });
  });

  renderOutput('fcfs', gantt, results, '#00d4ff');
}

// ===== SJF =====
function runSJF() {
  const procs = [...state.sjf.processes];
  if (!procs.length) return alert('Add at least one process!');
  const preemptive = document.getElementById('sjf-preemptive').checked;

  if (!preemptive) {
    // Non-preemptive SJF
    const remaining = procs.map(p => ({ ...p, done: false }));
    const gantt = [], results = [];
    let time = 0, completed = 0;
    const n = remaining.length;

    while (completed < n) {
      const available = remaining.filter(p => !p.done && p.arrival <= time);
      if (!available.length) {
        const next = remaining.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0];
        gantt.push({ pid: 'IDLE', start: time, end: next.arrival });
        time = next.arrival;
        continue;
      }
      available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
      const p = available[0];
      gantt.push({ pid: 'P' + p.id, start: time, end: time + p.burst });
      time += p.burst;
      p.done = true;
      completed++;
      const turnaround = time - p.arrival;
      const wait = turnaround - p.burst;
      results.push({ pid: 'P' + p.id, arrival: p.arrival, burst: p.burst, completion: time, turnaround, wait });
    }
    results.sort((a, b) => parseInt(a.pid.slice(1)) - parseInt(b.pid.slice(1)));
    renderOutput('sjf', gantt, results, '#ff6b35');

  } else {
    // Preemptive SJF (SRTF)
    const remaining = procs.map(p => ({ ...p, rem: p.burst, done: false }));
    const gantt = [], results = [];
    const n = remaining.length;
    let time = 0, completed = 0;
    let lastPid = null, lastStart = 0;

    while (completed < n) {
      const available = remaining.filter(p => !p.done && p.arrival <= time);
      if (!available.length) {
        const nxt = remaining.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0];
        if (lastPid) { gantt.push({ pid: lastPid, start: lastStart, end: time }); lastPid = null; }
        gantt.push({ pid: 'IDLE', start: time, end: nxt.arrival });
        time = nxt.arrival;
        continue;
      }
      available.sort((a, b) => a.rem - b.rem || a.arrival - b.arrival);
      const p = available[0];
      const pid = 'P' + p.id;
      if (pid !== lastPid) {
        if (lastPid) gantt.push({ pid: lastPid, start: lastStart, end: time });
        lastStart = time; lastPid = pid;
      }
      p.rem--;
      time++;
      if (p.rem === 0) {
        p.done = true; completed++;
        gantt.push({ pid: lastPid, start: lastStart, end: time });
        lastPid = null;
        const turnaround = time - p.arrival;
        const wait = turnaround - p.burst;
        results.push({ pid, arrival: p.arrival, burst: p.burst, completion: time, turnaround, wait });
      }
    }
    results.sort((a, b) => parseInt(a.pid.slice(1)) - parseInt(b.pid.slice(1)));
    const merged = [];
    gantt.forEach(g => {
      const last = merged[merged.length - 1];
      if (last && last.pid === g.pid && last.end === g.start) last.end = g.end;
      else merged.push({ ...g });
    });
    renderOutput('sjf', merged, results, '#ff6b35');
  }
}

// ===== PRIORITY =====
function runPriority() {
  const procs = [...state.priority.processes];
  if (!procs.length) return alert('Add at least one process!');
  const preemptive = document.getElementById('prio-preemptive').checked;

  if (!preemptive) {
    const remaining = procs.map(p => ({ ...p, done: false }));
    const gantt = [], results = [];
    let time = 0, completed = 0;
    const n = remaining.length;

    while (completed < n) {
      const available = remaining.filter(p => !p.done && p.arrival <= time);
      if (!available.length) {
        const nxt = remaining.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0];
        gantt.push({ pid: 'IDLE', start: time, end: nxt.arrival });
        time = nxt.arrival;
        continue;
      }
      available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
      const p = available[0];
      gantt.push({ pid: 'P' + p.id, start: time, end: time + p.burst });
      time += p.burst;
      p.done = true; completed++;
      const turnaround = time - p.arrival;
      const wait = turnaround - p.burst;
      results.push({ pid: 'P' + p.id, arrival: p.arrival, burst: p.burst, priority: p.priority, completion: time, turnaround, wait });
    }
    results.sort((a, b) => parseInt(a.pid.slice(1)) - parseInt(b.pid.slice(1)));
    renderOutput('priority', gantt, results, '#7c3aed');

  } else {
    // Preemptive priority
    const remaining = procs.map(p => ({ ...p, rem: p.burst, done: false }));
    const gantt = [], results = [];
    const n = remaining.length;
    let time = 0, completed = 0;
    let lastPid = null, lastStart = 0;

    while (completed < n) {
      const available = remaining.filter(p => !p.done && p.arrival <= time);
      if (!available.length) {
        const nxt = remaining.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0];
        if (lastPid) { gantt.push({ pid: lastPid, start: lastStart, end: time }); lastPid = null; }
        gantt.push({ pid: 'IDLE', start: time, end: nxt.arrival });
        time = nxt.arrival;
        continue;
      }
      available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
      const p = available[0];
      const pid = 'P' + p.id;
      if (pid !== lastPid) {
        if (lastPid) gantt.push({ pid: lastPid, start: lastStart, end: time });
        lastStart = time; lastPid = pid;
      }
      p.rem--;
      time++;
      if (p.rem === 0) {
        p.done = true; completed++;
        gantt.push({ pid: lastPid, start: lastStart, end: time });
        lastPid = null;
        const turnaround = time - p.arrival;
        const wait = turnaround - p.burst;
        results.push({ pid, arrival: p.arrival, burst: p.burst, priority: p.priority, completion: time, turnaround, wait });
      }
    }
    results.sort((a, b) => parseInt(a.pid.slice(1)) - parseInt(b.pid.slice(1)));
    const merged = [];
    gantt.forEach(g => {
      const last = merged[merged.length - 1];
      if (last && last.pid === g.pid && last.end === g.start) last.end = g.end;
      else merged.push({ ...g });
    });
    renderOutput('priority', merged, results, '#7c3aed');
  }
}

// ===== ROUND ROBIN =====
function runRR() {
  const procs = [...state.rr.processes];
  if (!procs.length) return alert('Add at least one process!');
  const quantum = parseInt(document.getElementById('rr-quantum').value) || 2;

  const remaining = procs.map(p => ({ ...p, rem: p.burst, done: false }));
  remaining.sort((a, b) => a.arrival - b.arrival);

  const gantt = [], results = [];
  const queue = [];
  let time = 0, i = 0;

  while (i < remaining.length && remaining[i].arrival <= time) queue.push(remaining[i++]);

  while (queue.length > 0 || i < remaining.length) {
    if (queue.length === 0) {
      const nxt = remaining[i];
      gantt.push({ pid: 'IDLE', start: time, end: nxt.arrival });
      time = nxt.arrival;
      while (i < remaining.length && remaining[i].arrival <= time) queue.push(remaining[i++]);
      continue;
    }

    const p = queue.shift();
    const pid = 'P' + p.id;
    const execTime = Math.min(quantum, p.rem);

    gantt.push({ pid, start: time, end: time + execTime });
    time += execTime;
    p.rem -= execTime;

    while (i < remaining.length && remaining[i].arrival <= time) queue.push(remaining[i++]);

    if (p.rem === 0) {
      p.done = true;
      const turnaround = time - p.arrival;
      const wait = turnaround - p.burst;
      results.push({ pid, arrival: p.arrival, burst: p.burst, completion: time, turnaround, wait });
    } else {
      queue.push(p);
    }
  }

  results.sort((a, b) => parseInt(a.pid.slice(1)) - parseInt(b.pid.slice(1)));

  const merged = [];
  gantt.forEach(g => {
    const last = merged[merged.length - 1];
    if (last && last.pid === g.pid && last.end === g.start) last.end = g.end;
    else merged.push({ ...g });
  });

  renderOutput('rr', merged, results, '#00ff88');
}

// ===== INIT =====
['fcfs', 'sjf', 'priority', 'rr'].forEach(algo => loadExample(algo));