// PatientForm.jsx — Driver Emergency Alert Form
// Mobile-first: large tap targets, minimal fields, one submit action
// Owner: Sayali Bhagwat

import { useRef, useState } from 'react';
import { CONDITIONS } from '../../../shared/types.js';
import { Truck, Zap, AlertTriangle, X, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// hi-IN handles Hinglish / Maringlish naturally — no language selection needed
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SPEECH_LANG = 'hi-IN';

const DEMO_PATIENTS = [
  { patientName: 'Rahul Sharma',  age: '34', condition: CONDITIONS.CRITICAL, bp: '90/60',  pulse: '112', eta: '8',  driverId: 'AMB-042', notes: 'Road accident, unconscious on arrival' },
  { patientName: 'Priya Mehta',   age: '28', condition: CONDITIONS.SERIOUS,  bp: '110/70', pulse: '95',  eta: '12', driverId: 'AMB-017', notes: 'Fall from height, suspected leg fracture' },
  { patientName: 'Arjun Patil',   age: '56', condition: CONDITIONS.CRITICAL, bp: '80/50',  pulse: '130', eta: '5',  driverId: 'AMB-031', notes: 'Chest pain, suspected cardiac arrest' },
  { patientName: 'Sunita Desai',  age: '42', condition: CONDITIONS.SERIOUS,  bp: '130/85', pulse: '88',  eta: '15', driverId: 'AMB-009', notes: 'Burns on arms and torso, conscious' },
  { patientName: 'Vikram Nair',   age: '19', condition: CONDITIONS.STABLE,   bp: '120/80', pulse: '78',  eta: '20', driverId: 'AMB-055', notes: 'Minor head injury, fully conscious' },
];

const CONDITION_CONFIG = {
  [CONDITIONS.CRITICAL]: {
    label: 'CRITICAL', desc: 'Life-threatening', icon: <AlertTriangle size={24} />,
    active:   'bg-[var(--color-critical)] border-[var(--color-critical)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-critical)]',
    inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-critical)] hover:bg-[var(--color-critical-light)]',
  },
  [CONDITIONS.SERIOUS]: {
    label: 'SERIOUS', desc: 'Urgent care', icon: <AlertTriangle size={24} />,
    active:   'bg-[var(--color-serious)] border-[var(--color-serious)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-serious)]',
    inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-serious)] hover:bg-[var(--color-serious-light)]',
  },
  [CONDITIONS.STABLE]: {
    label: 'STABLE', desc: 'Monitoring', icon: <AlertTriangle size={24} />,
    active:   'bg-[var(--color-stable)] border-[var(--color-stable)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-stable)]',
    inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-stable)] hover:bg-[var(--color-stable-light)]',
  },
};

export default function PatientForm({ onAlertSent }) {
  // Form state
  const [patientName, setPatientName] = useState('');
  const [age,         setAge]         = useState('');
  const [condition,   setCondition]   = useState(null);
  const [bp,          setBp]          = useState('');
  const [pulse,       setPulse]       = useState('');
  const [eta,         setEta]         = useState('');
  const [driverId,     setDriverId]     = useState('');
  const [hospitalName, setHospitalName] = useState('City General Hospital');
  const [notes,        setNotes]        = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  // Voice state
  const [recording,   setRecording]   = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [manualText,  setManualText]  = useState('');
  const recognitionRef = useRef(null);
  const lastDemoIndex  = useRef(-1);

  const hasAnyValue = patientName || age || condition || bp || pulse || eta || notes || (hospitalName !== 'City General Hospital');

  // ── Voice ──────────────────────────────────────────────────────────────────
  async function startRecording() {
    if (!SpeechRecognition) {
      setVoiceStatus('error: speech not supported — use text');
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceStatus('error: mic blocked — use text');
      return;
    }
    launchRecognition('hi-IN');
  }

  function launchRecognition(lang) {
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;      // keep listening until user taps stop
    recognition.interimResults = true;  // show live text as user speaks
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      // Show live transcript in text box
      setManualText((finalTranscript + interim).trim());
    };
    recognition.onerror = (e) => {
      setRecording(false);
      console.error('[SPEECH] error:', e.error, 'lang:', lang);
      if (e.error === 'network' && lang === 'hi-IN') {
        launchRecognition('en-US');  // retry with en-US
      } else if (e.error === 'network') {
        setVoiceStatus('error: network — ' + lang);
      } else if (e.error === 'not-allowed') {
        setVoiceStatus('error: mic blocked — use text');
      } else {
        setVoiceStatus('error: ' + e.error);
      }
    };
    recognition.onend = () => { /* handled by stopRecording */ };

    try {
      recognition.start();
      setRecording(true);
      setVoiceStatus('recording');
    } catch {
      setVoiceStatus('error: could not start mic — use text');
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
    // After stopping, auto-parse whatever is in the text box
    setManualText(prev => {
      const text = prev.trim();
      if (text) {
        setVoiceStatus('processing');
        parseTranscript(text);
      } else {
        setVoiceStatus('idle');
      }
      return text;
    });
  }

  async function parseTranscript(transcript) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const result = await res.json();
      console.log('[VOICE] raw result:', JSON.stringify(result));
      const hasAny = Object.values(result).some(v => v !== null);
      if (!hasAny) { setVoiceStatus('error: could not understand — add BP/pulse/condition'); return; }
      if (result.name)      setPatientName(result.name);
      if (result.age)       setAge(String(result.age));
      if (result.condition) setCondition(result.condition);
      if (result.bp)        setBp(result.bp);
      if (result.pulse)     setPulse(String(result.pulse));
      if (result.eta)       setEta(String(result.eta));
      if (result.notes)     setNotes(result.notes);
      setVoiceStatus('done');
    } catch (err) {
      console.error('[VOICE] parse error:', err);
      setVoiceStatus('error: could not reach backend');
    }
  }

  // ── Demo / Clear ───────────────────────────────────────────────────────────
  function loadDemoData() {
    let idx;
    do { idx = Math.floor(Math.random() * DEMO_PATIENTS.length); }
    while (idx === lastDemoIndex.current && DEMO_PATIENTS.length > 1);
    lastDemoIndex.current = idx;
    const p = DEMO_PATIENTS[idx];
    setPatientName(p.patientName); setAge(p.age); setCondition(p.condition);
    setBp(p.bp); setPulse(p.pulse); setEta(p.eta); setDriverId(p.driverId);
    setNotes(p.notes); setError(null);
    toast.success(`Demo: ${p.patientName}`);
  }

  function clearDemoData() {
    setPatientName(''); setAge(''); setCondition(null);
    setBp(''); setPulse(''); setEta(''); setDriverId('');
    setHospitalName('City General Hospital'); setNotes('');
    setError(null); lastDemoIndex.current = -1;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!condition) { setError('Select condition: CRITICAL / SERIOUS / STABLE'); return; }
    if (!eta) { setError('ETA is required — how many minutes?'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alert/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          age:         parseInt(age)   || 0,
          condition,
          bp:          bp.trim(),
          pulse:       parseInt(pulse) || 0,
          eta:         parseInt(eta)   || 0,
          driverId:    driverId.trim() || 'AMB-001',
          notes:       notes.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      const alertId = data.alertId || data.alert_id || data.id;
      if (!alertId) throw new Error('No alert ID returned from server');
      toast.success('Alert transmitted');
      onAlertSent(alertId, {
        patientName: patientName.trim(), age: parseInt(age) || 0, condition,
        bp: bp.trim(), pulse: parseInt(pulse) || 0, eta: parseInt(eta) || 0,
        driverId: driverId.trim() || 'AMB-001', notes: notes.trim(),
        hospitalName: hospitalName.trim() || 'City General Hospital',
      });
    } catch (err) {
      setError(err?.message || 'Failed to send alert. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Voice status helpers ───────────────────────────────────────────────────
  const STATUS_CFG = {
    idle:       { color: 'var(--color-text-muted)', text: 'Tap mic — speak in Hindi, English, or Hinglish' },
    recording:  { color: 'var(--color-critical)',   text: 'Listening... speak now' },
    processing: { color: 'var(--color-brand)',      text: 'Analysing with AI...' },
    done:       { color: 'var(--color-stable)',     text: 'Form filled — verify details' },
  };
  const isVoiceError  = voiceStatus.startsWith('error:');
  const statusColor   = isVoiceError ? 'var(--color-critical)' : (STATUS_CFG[voiceStatus]?.color ?? 'var(--color-text-muted)');
  const statusText    = isVoiceError ? voiceStatus.replace('error: ', '') : (STATUS_CFG[voiceStatus]?.text ?? voiceStatus);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh max-w-[420px] mx-auto bg-[var(--color-bg-primary)]">

      {/* Top bar */}
      <div className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] h-14 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-[var(--color-serious)]" />
          <span className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)]">Aarogya Sanchalak</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-[var(--color-serious-light)] text-[var(--color-serious)]">
            {driverId || 'AMB-001'}
          </span>
          <button
            type="button"
            onClick={hasAnyValue ? clearDemoData : loadDemoData}
            className="flex items-center gap-1 text-[var(--font-xs)] font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] px-2 py-1 rounded-[4px] hover:bg-gray-200"
          >
            {hasAnyValue ? <><X size={12} /> Clear</> : <><Zap size={12} className="text-amber-500" /> Demo</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-5">

        {/* Voice / AI section */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-card flex flex-col gap-3">

          {/* Text input — always visible, primary method */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              AI Auto-Fill — speak or type in any language
            </p>
            <textarea
              rows={2}
              placeholder="e.g. Rahul, 34 saal, critical hai, BP 90/60, 8 minute mein"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid var(--color-border)', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, resize: 'none',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Action row: mic + fill button */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Mic button */}
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              title={recording ? 'Stop recording' : 'Tap to speak'}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: recording ? 'var(--color-critical)' : 'var(--color-brand)',
                transition: 'background 200ms',
                animation: recording ? 'pulse 1s infinite' : 'none',
              }}
            >
              {recording ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
            </button>

            {/* Fill button */}
            <button
              type="button"
              disabled={(!manualText.trim() && !recording) || voiceStatus === 'processing'}
              onClick={() => {
                if (manualText.trim()) {
                  setVoiceStatus('processing');
                  parseTranscript(manualText.trim());
                }
              }}
              style={{
                flex: 1, height: 44, background: 'var(--color-brand)', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: manualText.trim() ? 'pointer' : 'not-allowed',
                opacity: manualText.trim() ? 1 : 0.45,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {voiceStatus === 'processing'
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analysing...</>
                : 'Fill form with AI'}
            </button>
          </div>

          {/* Status line */}
          <p style={{ textAlign: 'center', fontSize: 11, color: statusColor, margin: 0 }}>
            {recording ? 'Listening... speak now' : statusText}
          </p>
        </div>

        {/* Patient Identity */}
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="patient-name">Patient Name</label>
            <input id="patient-name" type="text" placeholder="Full name" value={patientName}
              onChange={e => setPatientName(e.target.value)}
              className={clsx("w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
          </div>
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="patient-age">Age</label>
            <input id="patient-age" type="number" min={0} max={120} placeholder="Years" value={age}
              onChange={e => setAge(e.target.value)}
              className={clsx("w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-2">Condition Level <span className="text-[var(--color-critical)]">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(CONDITIONS).map(cond => {
              const cfg = CONDITION_CONFIG[cond];
              return (
                <button key={cond} type="button" onClick={() => setCondition(cond)}
                  className={clsx('flex flex-col items-center justify-center rounded-[8px] border-2 py-3 px-1 min-h-[96px] transition-all',
                    condition === cond ? cfg.active : cfg.inactive)}>
                  <span className="mb-1">{cfg.icon}</span>
                  <span className="font-bold text-[12px] tracking-wide">{cfg.label}</span>
                  <span className="text-[10px] font-normal mt-0.5 opacity-80">{cfg.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="bp-input">
              BP <span className="text-[10px] font-normal opacity-70">(mmHg)</span>
            </label>
            <input id="bp-input" type="text" placeholder="120/80" value={bp}
              onChange={e => setBp(e.target.value)}
              className={clsx("w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
          </div>
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="pulse-input">
              Pulse <span className="text-[10px] font-normal opacity-70">(bpm)</span>
            </label>
            <input id="pulse-input" type="number" min={0} max={300} placeholder="112" value={pulse}
              onChange={e => setPulse(e.target.value)}
              className={clsx("w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
          </div>
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="hospital-input">
            Navigating to <span className="text-[10px] font-normal opacity-70">(hospital) *</span>
          </label>
          <input id="hospital-input" type="text" placeholder="City General Hospital" value={hospitalName}
            onChange={e => setHospitalName(e.target.value)}
            className={clsx("w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
              "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
              "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
        </div>

        {/* ETA */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="eta-input">
            ETA <span className="text-[10px] font-normal opacity-70">(minutes) *</span>
          </label>
          <div className="relative">
            <input id="eta-input" type="number" required min={1} max={120} placeholder="8" value={eta}
              onChange={e => setEta(e.target.value)}
              className={clsx("w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 pr-16 min-h-[64px] text-[var(--font-2xl)] font-bold text-center shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-[var(--font-sm)] pointer-events-none">min</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="notes-input">
            Clinical Notes <span className="text-[10px] font-normal opacity-70">(optional)</span>
          </label>
          <textarea id="notes-input" rows={2} placeholder="Trauma, allergies, symptoms..." value={notes}
            onChange={e => setNotes(e.target.value)}
            className={clsx("w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
              "border border-[var(--color-border)] rounded-[8px] px-4 py-3 min-h-[80px] text-[var(--font-base)] shadow-sm resize-none",
              "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors")} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[var(--color-critical-light)] border border-[var(--color-critical)] rounded-[8px] px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-[var(--color-critical)] shrink-0 mt-0.5" />
            <p className="text-[var(--color-critical)] text-[var(--font-sm)] font-medium leading-snug">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="pb-6">
          <button type="submit" disabled={loading}
            className={clsx("w-full select-none rounded-[10px] min-h-[64px] flex items-center justify-center gap-2",
              "text-white font-bold text-[var(--font-lg)] tracking-wide uppercase transition-all shadow-card",
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--color-critical)] hover:bg-[#7b1515] active:scale-[0.98]")}>
            {loading
              ? <><span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} /> Transmitting...</>
              : <><AlertTriangle size={24} /> Alert Hospital</>}
          </button>
        </div>

      </form>
    </div>
  );
}
