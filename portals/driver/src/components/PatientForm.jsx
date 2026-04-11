// PatientForm.jsx — Driver Emergency Alert Form
// Mobile-first: large tap targets, minimal fields, one submit action
// Owner: Sayali Bhagwat

import { useRef, useState } from 'react';
import { CONDITIONS } from '../../../shared/types.js';
import { Truck, Zap, AlertTriangle, X, Mic, MicOff, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const TRANSLATIONS = {
  EN: {
    title: 'Patient Details',
    name: 'Patient Name', age: 'Age',
    condition: 'Condition Level', bp: 'BP', bpUnit: '(mmHg)',
    pulse: 'Pulse', pulseUnit: '(bpm)',
    eta: 'ETA', etaUnit: '(minutes) *',
    notes: 'Clinical Notes', optional: 'optional',
    alert: 'ALERT HOSPITAL', load: 'Demo', clear: 'Clear',
    critical: 'Life-threatening', serious: 'Urgent care', stable: 'Monitoring',
    heading: 'Navigating to', hospital: '(hospital)',
    aiLabel: 'AI Auto-Fill — speak or type in any language',
    aiPlaceholder: 'e.g. Rahul, 34 saal, critical hai, BP 90/60, 8 minute mein',
    fillBtn: 'Fill form with AI', analysing: 'Analysing...',
    listening: 'Listening... speak now',
    tapMic: 'Tap mic — speak in Hindi, English, or Hinglish',
    formFilled: 'Form filled — verify details',
    transmitting: 'Transmitting...',
    namePlaceholder: 'Full name', agePlaceholder: 'Years',
    notesPh: 'Trauma, allergies, symptoms...',
    hospitalPh: 'City General Hospital',
  },
  HI: {
    title: 'मरीज़ की जानकारी',
    name: 'मरीज़ का नाम', age: 'उम्र',
    condition: 'स्थिति', bp: 'ब्लड प्रेशर', bpUnit: '(mmHg)',
    pulse: 'नाड़ी', pulseUnit: '(bpm)',
    eta: 'पहुंचने का समय', etaUnit: '(मिनट) *',
    notes: 'नोट्स', optional: 'वैकल्पिक',
    alert: 'अस्पताल को सूचित करें', load: 'डेमो', clear: 'साफ़ करें',
    critical: 'गंभीर', serious: 'तत्काल', stable: 'स्थिर',
    heading: 'जा रहे हैं', hospital: '(अस्पताल)',
    aiLabel: 'AI से भरें — किसी भी भाषा में बोलें या टाइप करें',
    aiPlaceholder: 'जैसे: राहुल, 34 साल, क्रिटिकल है, BP 90/60, 8 मिनट में',
    fillBtn: 'AI से फॉर्म भरें', analysing: 'विश्लेषण हो रहा है...',
    listening: 'सुन रहे हैं... अभी बोलें',
    tapMic: 'माइक दबाएं — हिंदी, English या Hinglish में बोलें',
    formFilled: 'फॉर्म भरा गया — जांच करें',
    transmitting: 'भेजा जा रहा है...',
    namePlaceholder: 'पूरा नाम', agePlaceholder: 'वर्ष',
    notesPh: 'चोट, एलर्जी, लक्षण...',
    hospitalPh: 'सिटी जनरल अस्पताल',
  },
  MR: {
    title: 'रुग्णाची माहिती',
    name: 'रुग्णाचे नाव', age: 'वय',
    condition: 'स्थिती', bp: 'रक्तदाब', bpUnit: '(mmHg)',
    pulse: 'नाडी', pulseUnit: '(bpm)',
    eta: 'पोहोचण्याचा वेळ', etaUnit: '(मिनिटे) *',
    notes: 'नोंदी', optional: 'पर्यायी',
    alert: 'रुग्णालयास सूचित करा', load: 'डेमो', clear: 'साफ करा',
    critical: 'गंभीर', serious: 'तातडीचे', stable: 'स्थिर',
    heading: 'जात आहोत', hospital: '(रुग्णालय)',
    aiLabel: 'AI ने भरा — कोणत्याही भाषेत बोला किंवा टाइप करा',
    aiPlaceholder: 'उदा: राहुल, ३४ वर्षे, गंभीर आहे, BP ९०/६०, ८ मिनिटांत',
    fillBtn: 'AI ने फॉर्म भरा', analysing: 'विश्लेषण होत आहे...',
    listening: 'ऐकत आहे... आता बोला',
    tapMic: 'माइक दाबा — मराठी, English किंवा Hinglish मध्ये बोला',
    formFilled: 'फॉर्म भरला — तपासा',
    transmitting: 'पाठवत आहे...',
    namePlaceholder: 'पूर्ण नाव', agePlaceholder: 'वर्षे',
    notesPh: 'दुखापत, ऍलर्जी, लक्षणे...',
    hospitalPh: 'सिटी जनरल रुग्णालय',
  },
};

const SPEECH_LANG_MAP = { EN: 'en-US', HI: 'hi-IN', MR: 'mr-IN' };

const BLOOD_LOSS_OPTIONS = ['None', 'Minor', 'Moderate', 'Severe'];
const BLOOD_GROUPS = ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_LOSS_STYLE = {
  None:     { active: 'bg-gray-500 text-white border-gray-500', inactive: 'bg-white text-gray-600 border-gray-300' },
  Minor:    { active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-yellow-600 border-yellow-300' },
  Moderate: { active: 'bg-orange-500 text-white border-orange-500', inactive: 'bg-white text-orange-600 border-orange-300' },
  Severe:   { active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-600 border-red-400' },
};

const DEMO_PATIENTS = [
  { patientName: 'Rahul Sharma',  age: '34', condition: CONDITIONS.CRITICAL, bp: '90/60',  pulse: '112', eta: '8',  driverId: 'AMB-042', notes: 'Road accident, unconscious on arrival' },
  { patientName: 'Priya Mehta',   age: '28', condition: CONDITIONS.SERIOUS,  bp: '110/70', pulse: '95',  eta: '12', driverId: 'AMB-017', notes: 'Fall from height, suspected leg fracture' },
  { patientName: 'Arjun Patil',   age: '56', condition: CONDITIONS.CRITICAL, bp: '80/50',  pulse: '130', eta: '5',  driverId: 'AMB-031', notes: 'Chest pain, suspected cardiac arrest' },
  { patientName: 'Sunita Desai',  age: '42', condition: CONDITIONS.SERIOUS,  bp: '130/85', pulse: '88',  eta: '15', driverId: 'AMB-009', notes: 'Burns on arms and torso, conscious' },
  { patientName: 'Vikram Nair',   age: '19', condition: CONDITIONS.STABLE,   bp: '120/80', pulse: '78',  eta: '20', driverId: 'AMB-055', notes: 'Minor head injury, fully conscious' },
];

export default function PatientForm({ onAlertSent }) {
  // Lang
  const [lang, setLang] = useState('EN');
  const t = TRANSLATIONS[lang];

  // Form state
  const [patientName,  setPatientName]  = useState('');
  const [age,          setAge]          = useState('');
  const [condition,    setCondition]    = useState(null);
  const [bp,           setBp]           = useState('');
  const [pulse,        setPulse]        = useState('');
  const [eta,          setEta]          = useState('');
  const [driverId,     setDriverId]     = useState('');
  const [hospitalName, setHospitalName] = useState('City General Hospital');
  const [bloodLoss,    setBloodLoss]    = useState('None');
  const [bloodGroup,   setBloodGroup]   = useState('Unknown');
  const [notes,        setNotes]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  // Voice state
  const [recording,   setRecording]   = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [manualText,  setManualText]  = useState('');
  const recognitionRef = useRef(null);
  const lastDemoIndex  = useRef(-1);

  const CONDITION_CONFIG = {
    [CONDITIONS.CRITICAL]: {
      label: 'CRITICAL', desc: t.critical, icon: <AlertTriangle size={24} />,
      active:   'bg-[var(--color-critical)] border-[var(--color-critical)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-critical)]',
      inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-critical)] hover:bg-[var(--color-critical-light)]',
    },
    [CONDITIONS.SERIOUS]: {
      label: 'SERIOUS', desc: t.serious, icon: <AlertTriangle size={24} />,
      active:   'bg-[var(--color-serious)] border-[var(--color-serious)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-serious)]',
      inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-serious)] hover:bg-[var(--color-serious-light)]',
    },
    [CONDITIONS.STABLE]: {
      label: 'STABLE', desc: t.stable, icon: <AlertTriangle size={24} />,
      active:   'bg-[var(--color-stable)] border-[var(--color-stable)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-stable)]',
      inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-stable)] hover:bg-[var(--color-stable-light)]',
    },
  };

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
    launchRecognition(SPEECH_LANG_MAP[lang] || 'hi-IN');
  }

  function launchRecognition(speechLang) {
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;
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
      setManualText((finalTranscript + interim).trim());
    };

    recognition.onerror = (e) => {
      setRecording(false);
      console.error('[SPEECH] error:', e.error, 'lang:', speechLang);
      if (e.error === 'network' && speechLang !== 'en-US') {
        launchRecognition('en-US');
      } else if (e.error === 'network') {
        setVoiceStatus('error: network — use text');
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
    setVoiceStatus('idle');
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
      if (!hasAny) { setVoiceStatus('error: could not understand — try again'); return; }
      if (result.name)         setPatientName(result.name);
      if (result.age)          setAge(String(result.age));
      if (result.condition)    setCondition(result.condition);
      if (result.bp)           setBp(result.bp);
      if (result.pulse)        setPulse(String(result.pulse));
      if (result.eta)          setEta(String(result.eta));
      if (result.bloodLoss)    setBloodLoss(result.bloodLoss);
      if (result.bloodGroup)   setBloodGroup(result.bloodGroup);
      if (result.hospitalName) setHospitalName(result.hospitalName);
      if (result.notes)        setNotes(result.notes);
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
    setHospitalName('City General Hospital'); setBloodLoss('None');
    setBloodGroup('Unknown'); setNotes('');
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
          bloodLoss,
          bloodGroup,
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
        bloodLoss, bloodGroup,
      });
    } catch (err) {
      setError(err?.message || 'Failed to send alert. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Voice status ───────────────────────────────────────────────────────────
  const STATUS_CFG = {
    idle:       { color: 'var(--color-text-muted)', text: t.tapMic },
    recording:  { color: 'var(--color-critical)',   text: t.listening },
    processing: { color: 'var(--color-brand)',      text: t.analysing },
    done:       { color: 'var(--color-stable)',     text: t.formFilled },
  };
  const isVoiceError = voiceStatus.startsWith('error:');
  const statusColor  = isVoiceError ? 'var(--color-critical)' : (STATUS_CFG[voiceStatus]?.color ?? 'var(--color-text-muted)');
  const statusText   = isVoiceError ? voiceStatus.replace('error: ', '') : (STATUS_CFG[voiceStatus]?.text ?? voiceStatus);

  const inputCls = clsx(
    'w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]',
    'border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm',
    'focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors'
  );

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
          {/* Language dropdown */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            style={{
              fontSize: 12, fontWeight: 600, border: '1px solid var(--color-border-strong)',
              borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
              background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
            }}
          >
            <option value="EN">English</option>
            <option value="HI">हिंदी</option>
            <option value="MR">मराठी</option>
          </select>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-[var(--color-serious-light)] text-[var(--color-serious)]">
            {driverId || 'AMB-001'}
          </span>
          <button
            type="button"
            onClick={hasAnyValue ? clearDemoData : loadDemoData}
            className="flex items-center gap-1 text-[var(--font-xs)] font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] px-2 py-1 rounded-[4px] hover:bg-gray-200"
          >
            {hasAnyValue
              ? <><X size={12} /> {t.clear}</>
              : <><Zap size={12} className="text-amber-500" /> {t.load}</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-5">

        {/* Voice / AI section */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-card flex flex-col gap-3">
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              {t.aiLabel}
            </p>
            <textarea
              rows={2}
              placeholder={t.aiPlaceholder}
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

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              title={recording ? 'Stop' : 'Tap to speak'}
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

            <button
              type="button"
              disabled={recording || (!manualText.trim()) || voiceStatus === 'processing'}
              onClick={() => {
                if (manualText.trim() && !recording) {
                  setVoiceStatus('processing');
                  parseTranscript(manualText.trim());
                }
              }}
              style={{
                flex: 1, height: 44, background: recording ? 'var(--color-text-muted)' : 'var(--color-brand)', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: (!recording && manualText.trim()) ? 'pointer' : 'not-allowed',
                opacity: (!recording && manualText.trim()) ? 1 : 0.45,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {voiceStatus === 'processing'
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t.analysing}</>
                : t.fillBtn}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: statusColor, margin: 0 }}>
            {recording ? `${t.listening} — tap stop mic when done` : statusText}
          </p>
        </div>

        {/* Patient Identity */}
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="patient-name">
              {t.name}
            </label>
            <input id="patient-name" type="text" placeholder={t.namePlaceholder} value={patientName}
              onChange={e => setPatientName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="patient-age">
              {t.age}
            </label>
            <input id="patient-age" type="number" min={0} max={120} placeholder={t.agePlaceholder} value={age}
              onChange={e => setAge(e.target.value)} className={clsx(inputCls, 'font-data')} />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-2">
            {t.condition} <span className="text-[var(--color-critical)]">*</span>
          </label>
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
              {t.bp} <span className="text-[10px] font-normal opacity-70">{t.bpUnit}</span>
            </label>
            <input id="bp-input" type="text" placeholder="120/80" value={bp}
              onChange={e => setBp(e.target.value)} className={clsx(inputCls, 'font-data')} />
          </div>
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="pulse-input">
              {t.pulse} <span className="text-[10px] font-normal opacity-70">{t.pulseUnit}</span>
            </label>
            <input id="pulse-input" type="number" min={0} max={300} placeholder="112" value={pulse}
              onChange={e => setPulse(e.target.value)} className={clsx(inputCls, 'font-data')} />
          </div>
        </div>

        {/* Blood */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-[var(--color-critical)]" />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
              Blood Loss &amp; Group
            </span>
          </div>

          {/* Blood loss selector */}
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-2">
              Blood Loss
            </label>
            <div className="grid grid-cols-4 gap-1">
              {BLOOD_LOSS_OPTIONS.map(opt => {
                const s = BLOOD_LOSS_STYLE[opt];
                return (
                  <button key={opt} type="button"
                    onClick={() => setBloodLoss(opt)}
                    className={`rounded-[6px] border py-2 text-[11px] font-bold transition-all ${bloodLoss === opt ? s.active : s.inactive}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blood group dropdown */}
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={e => setBloodGroup(e.target.value)}
              className={inputCls}
              style={{ height: 48 }}
            >
              {BLOOD_GROUPS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="hospital-input">
            {t.heading} <span className="text-[10px] font-normal opacity-70">{t.hospital}</span>
          </label>
          <input id="hospital-input" type="text" placeholder={t.hospitalPh} value={hospitalName}
            onChange={e => setHospitalName(e.target.value)} className={inputCls} />
        </div>

        {/* ETA */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="eta-input">
            {t.eta} <span className="text-[10px] font-normal opacity-70">{t.etaUnit}</span>
          </label>
          <div className="relative">
            <input id="eta-input" type="number" required min={1} max={120} placeholder="8" value={eta}
              onChange={e => setEta(e.target.value)}
              className={clsx('w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]',
                'border border-[var(--color-border)] rounded-[8px] px-4 pr-16 min-h-[64px] text-[var(--font-2xl)] font-bold text-center shadow-sm',
                'focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors')} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-[var(--font-sm)] pointer-events-none">min</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="notes-input">
            {t.notes} <span className="text-[10px] font-normal opacity-70">({t.optional})</span>
          </label>
          <textarea id="notes-input" rows={2} placeholder={t.notesPh} value={notes}
            onChange={e => setNotes(e.target.value)}
            className={clsx('w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]',
              'border border-[var(--color-border)] rounded-[8px] px-4 py-3 min-h-[80px] text-[var(--font-base)] shadow-sm resize-none',
              'focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors')} />
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
            className={clsx('w-full select-none rounded-[10px] min-h-[64px] flex items-center justify-center gap-2',
              'text-white font-bold text-[var(--font-lg)] tracking-wide uppercase transition-all shadow-card',
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--color-critical)] hover:bg-[#7b1515] active:scale-[0.98]')}>
            {loading
              ? <><span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} /> {t.transmitting}</>
              : <><AlertTriangle size={24} /> {t.alert}</>}
          </button>
        </div>

      </form>
    </div>
  );
}
