import { Fragment, useEffect, useMemo, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { Bell, BriefcaseBusiness, CalendarDays, CheckSquare, ChevronDown, ChevronRight, ClipboardList, Download, FileText, Grid2X2, Headphones, LayoutDashboard, Pause, Phone, Play, Search, UserRound, X } from "lucide-react";
import "@/App.css";

const dispositions = {
  "Government Portal Issue": ["Portal Not Working", "Portal Timeout", "OTP Failure", "Server Error"],
  "Client Dependency": ["Information Awaited", "Client Unavailable"],
  "Technical Issue": ["Application Error", "System Error"],
  "Document Issue": ["Incorrect Document", "Missing Document"],
  "Information Required": ["TRN Number Not Received", "Clarification Required"],
  Other: ["Other"]
};
const requiresEvidence = ["Portal Not Working", "Portal Timeout", "OTP Failure", "Server Error", "Application Error", "System Error"];
const services = {
  "Trademark Filing": { workMinutes: 30, bufferMinutes: 10, assigned: true },
  "ISO": { workMinutes: 25, bufferMinutes: 15, assigned: false },
  "GST Registration": { workMinutes: 20, bufferMinutes: 10, assigned: false }
};
const masterConfigs = [
  ["O4560674177LI", { "Trademark Filing": 12, "ISO": 4, "GST Registration": 1 }],
  ["O4560594177LI", { "Trademark Filing": 8, "GST Registration": 2, "ISO": 2 }],
  ["O4520694177LI", { "GST Registration": 5, "Trademark Filing": 3 }],
  ["O2560694177LI", { "ISO": 6, "Trademark Filing": 4, "GST Registration": 2 }],
  ["O4561694177LI", { "Trademark Filing": 10, "ISO": 2 }]
];
const buildSeed = () => {
  const items = []; let n = 78710;
  masterConfigs.forEach(([masterId, mix]) => {
    Object.entries(mix).forEach(([service, count]) => {
      for (let i = 0; i < count; i++) {
        items.push({ id: `OLI174955765${n}`, service, ...services[service], status: "YET_TO_WORK", masterId });
        n++;
      }
    });
  });
  return items;
};

const tmrCustomers = [
  { name: "Aditya Sadhu", state: "West Bengal", amount: 1799, age: "1 days" },
  { name: "Rohit Sharma", state: "Maharashtra", amount: 2499, age: "2 days" },
  { name: "Meena Verma", state: "Delhi", amount: 1799, age: "3 days" },
  { name: "Amit Patel", state: "Gujarat", amount: 2999, age: "1 days" },
  { name: "Priya Iyer", state: "Karnataka", amount: 1999, age: "4 days" },
  { name: "Karan Singh", state: "Punjab", amount: 1799, age: "1 days" },
  { name: "Neha Reddy", state: "Telangana", amount: 2499, age: "2 days" },
  { name: "Sneha Das", state: "Odisha", amount: 1799, age: "1 days" },
  { name: "Vikas Yadav", state: "Uttar Pradesh", amount: 2999, age: "5 days" },
  { name: "Anjali Nair", state: "Kerala", amount: 1999, age: "1 days" }
];
const tmrOliIds = ["OLI12345678914785", "OLI12345678936985", "OLI12345678985214", "OLI14789632587410", "OLI12345695135748", "OLI12457836998647", "OLI74896512375600", "OLI12455697834679", "OLI14797683541487", "OLI97846152349786"];
const buildTmrSeed = () => tmrOliIds.map((id, i) => ({
  id, name: tmrCustomers[i].name, masterId: `O2148749657${i}LI`, state: tmrCustomers[i].state, amount: tmrCustomers[i].amount, age: tmrCustomers[i].age,
  package: "TMRBS", service: "Trademark Registration", workMinutes: 30, bufferMinutes: 10, assigned: true, status: "YET_TO_WORK"
}));

const draftBlank = { remark:"", fileName:"", brandName:"", className:"", type:"", followupDate:"", followupTime:"", disposition:"" };
const initial = { tmrItems: buildTmrSeed(), active: null, priority: [], allCallSchedule: [], completedFilings: [], audit: [], target: 7, completed: 0, normalCompleted: 0, bufferCompleted: 0, priorityResolved: 0 };
const STORAGE_KEY = "oli-live-work-v5";
const load = () => initial;
const save = (state) => {};
const fmt = (seconds) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const today = () => new Date().toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

function Shell({ state, children }) {
  const [tmrOpen, setTmrOpen] = useState(true);
  const topLinks = [
    ["Dashboard", "/employee/home/dashboard", LayoutDashboard],
    ["Multisale Request", "#", ClipboardList],
    ["CRM Mailbox", "#", Headphones],
    ["Happy Code", "#", CheckSquare],
    ["All Call Schedule", "/employee/all-call-schedule", CalendarDays],
    ["Pending for GPay", "#", CheckSquare],
    ["Paid GPay", "#", CheckSquare],
    ["Check Prospect Status", "#", CheckSquare]
  ];
  const bottomLinks = [
    ["New Doc Panel", "#", Grid2X2],
    ["Priority", "/employee/priority", BriefcaseBusiness],
    ["GST Registration", "#", Grid2X2],
    ["GST Modification", "#", Grid2X2],
    ["GST Cancellation", "#", Grid2X2],
    ["GST Return", "#", Grid2X2]
  ];
  const tmrSub = [
    { label: "Fresh Unassign", cyan: true },
    { label: "TMR Premium Fresh", cyan: true },
    { label: "Yet to Work", arrow: true, path: "/employee/trademark-registration/yet-to-work", testid: "tmr-yet-to-work" },
    { label: "Govt Fee Paid", arrow: true },
    { label: "TMA Draft Approved", arrow: true },
    { label: "TMA Draft Rejected", arrow: true },
    { label: "TMA Modification Request", arrow: true },
    { label: "Transferred For E-Sign", arrow: true },
    { label: "E-Sign Modification", arrow: true },
    { label: "TMRP TMA Draft Saved", arrow: true },
    { label: "Challan Payment Done", arrow: true },
    { label: "Govt. Follow Up", arrow: true },
    { label: "TMR Premium Hold", arrow: true },
    { label: "TMR Premium Report Saved", arrow: false }
  ];
  const renderLink = ([label, path, Icon]) => path === "#"
    ? <div className={`side-link ${label === "CRM Mailbox" ? "active-old" : ""}`} key={label} data-testid={`sidebar-${label.toLowerCase().replaceAll(" ", "-")}`}><Icon size={16}/><span>{label}</span></div>
    : <NavLink key={label} to={path} className={({isActive}) => `side-link ${isActive ? "selected" : ""}`} data-testid={`sidebar-${label.toLowerCase().replaceAll(" ", "-")}`}>
        <Icon size={16}/><span>{label}</span>
        {label === "Priority" && <b className="badge" data-testid="priority-sidebar-badge">{state.priority.length}</b>}
        {label === "All Call Schedule" && state.allCallSchedule.length > 0 && <b className="badge acs" data-testid="acs-sidebar-badge">{state.allCallSchedule.length}</b>}
      </NavLink>;
  return <div className="oli-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">O</span><strong>nlineLegalIndia</strong><sup>™</sup><small>Beta</small></div>
      <div className="side-search">Search Side Menu Items <Search size={17}/></div>
      <nav>
        {topLinks.map(renderLink)}
        <div className="side-link tmr-header" onClick={() => setTmrOpen(v => !v)} data-testid="sidebar-trademark-registration">
          <Grid2X2 size={16}/>
          <span>Trademark Registration <em className="new-work">New Work (New)</em></span>
          {tmrOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </div>
        {tmrOpen && <div className="tmr-submenu">
          {tmrSub.map(item => item.path
            ? <NavLink key={item.label} to={item.path} className={({isActive}) => `tmr-subitem ${isActive ? "selected" : ""}`} data-testid={item.testid}>
                {item.label}{item.arrow && <span className="arrow"> -&gt;</span>}
                {item.badge > 0 && <b className="tmr-badge">{item.badge}</b>}
              </NavLink>
            : <div key={item.label} className={`tmr-subitem ${item.cyan ? "cyan" : ""}`}>
                {item.label}{item.arrow && <span className="arrow"> -&gt;</span>}
              </div>
          )}
        </div>}
        {bottomLinks.map(renderLink)}
      </nav>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="global-search">
          <select data-testid="global-search-option"><option>Select Search Option</option><option>OLI ID</option><option>Master ID</option></select>
          <input placeholder="Search with OLI id, Email, Mobile" data-testid="global-search-input"/>
          <button data-testid="global-search-button"><Search size={18}/></button>
        </div>
        <div className="top-icons"><BriefcaseBusiness/><span>0</span><Headphones className="red"/><Bell/><span>0</span><Download/><Bell/><div className="profile"><UserRound size={28}/><span>Abhik Datta</span><ChevronDown size={14}/></div></div>
      </header>
      {children}
    </main>
  </div>;
}

function Metrics({ state }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const pct = Math.round((state.normalCompleted / state.target) * 100);
  const performance = state.normalCompleted >= state.target + 5 ? "EXCELLENT" : state.normalCompleted >= state.target + 3 ? "GREAT" : state.normalCompleted >= state.target + 1 ? "VERY GOOD" : state.normalCompleted >= state.target ? "GOOD" : "POOR";
  const hasCompleted = state.completedFilings && state.completedFilings.length > 0;
  return <>
    <div className="metrics">
      <div><span>TARGET</span><strong data-testid="target-count">{state.target}</strong></div>
      <div className={`completed-card ${hasCompleted ? "clickable" : ""}`} onClick={hasCompleted ? () => setShowCompleted(true) : undefined} data-testid="completed-metric-card"><span>COMPLETED</span><strong data-testid="completed-count">{state.normalCompleted}</strong>{hasCompleted && <em className="metric-hint" data-testid="completed-view-hint">﹀</em>}</div>
      <div><span>REMAINING</span><strong data-testid="remaining-count">{Math.max(0, state.target - state.normalCompleted)}</strong></div>
      <div><span>PROGRESS</span><strong data-testid="completion-percent">{pct}%</strong></div>
      <div><span>PRIORITY</span><strong data-testid="priority-count">{state.priority.length}</strong></div>
      <div><span>PERFORMANCE</span><strong className="performance" data-testid="performance-label">{performance}</strong></div>
    </div>
    {showCompleted && <CompletedFilingsModal rows={state.completedFilings} onClose={()=>setShowCompleted(false)}/>}
  </>;
}

function CompletedFilingsModal({ rows, onClose }) {
  const [openId, setOpenId] = useState(null);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal completed-modal" data-testid="completed-filings-modal" onClick={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={onClose} data-testid="completed-modal-close"><X size={18}/></button>
    <div className="eyebrow">COMPLETED FILINGS</div>
    <h2>{rows.length} Completed {rows.length === 1 ? "Filing" : "Filings"}</h2>
    <p className="muted">Click any row to expand and see full details and the exact time you took.</p>
    <div className="completed-table-wrap"><table><thead><tr><th>OLI ID</th><th>CUSTOMER</th><th>BRAND</th><th>CLASS</th><th>TYPE</th><th>COMPLETED AT</th><th>TIME TAKEN</th><th></th></tr></thead><tbody>{rows.map((x, i) => <Fragment key={`${x.id}-${i}`}>
      <tr data-testid={`completed-modal-row-${x.id}`} onClick={()=>setOpenId(openId === x.id ? null : x.id)} className="clickable-row">
        <td className="oli-id">{x.id}</td>
        <td>{x.name}</td>
        <td>{x.draftDetails.brandName}</td>
        <td>{x.draftDetails.className}</td>
        <td>{x.draftDetails.type}</td>
        <td>{x.completedAt}</td>
        <td className={x.withinTime ? "green-time" : "red-time"} data-testid={`completed-modal-time-${x.id}`}><strong>{fmt(x.completionSeconds || 0)}</strong>{x.bufferUsed && <div><small>(Buffer)</small></div>}</td>
        <td><ChevronDown size={14} className={openId === x.id ? "chev-open" : "chev"}/></td>
      </tr>
      {openId === x.id && <tr className="detail-row" data-testid={`completed-modal-detail-${x.id}`}><td colSpan="8"><div className="detail-grid">
        <div><span>Master ID</span><strong>{x.masterId}</strong></div>
        <div><span>State</span><strong>{x.state}</strong></div>
        <div><span>Amount</span><strong>₹{x.amount}</strong></div>
        <div><span>Package</span><strong>{x.package}</strong></div>
        <div><span>Draft File</span><strong>{x.draftDetails.fileName}</strong></div>
        <div><span>Remark</span><strong>{x.draftDetails.remark}</strong></div>
        <div><span>Followup Scheduled</span><strong>{x.draftDetails.followupDate} · {x.draftDetails.followupTime}</strong></div>
        <div><span>Disposition</span><strong>{x.draftDetails.disposition}</strong></div>
        <div><span>Completed by</span><strong>{x.agent}</strong></div>
        <div><span>Buffer Used</span><strong className={x.bufferUsed ? "red-time" : "green-time"}>{x.bufferUsed ? "Yes" : "No"}</strong></div>
      </div></td></tr>}
    </Fragment>)}</tbody></table></div>
  </div></div>;
}

function DispositionModal({ kind, item, onCancel, onSubmit }) {
  const [d, setD] = useState(""); const [sd, setSd] = useState(""); const [remark, setRemark] = useState(""); const [evidence, setEvidence] = useState(false);
  const need = requiresEvidence.includes(sd);
  const submit = () => { if (!d || !sd || !remark.trim() || (need && !evidence)) return; onSubmit({ disposition: d, subDisposition: sd, remark, evidence }); };
  return <div className="modal-backdrop"><div className="modal" data-testid={`${kind}-modal`}>
    <button className="modal-close" onClick={onCancel} data-testid={`${kind}-modal-close`}><X size={18}/></button>
    <div className="eyebrow">LIVE WORK</div>
    <h2>{kind === "pause" ? "Pause Live Work" : "Work Not Completed"}</h2>
    <p className="muted">{item?.id} · {item?.name || item?.service}</p>
    <label>Disposition *<select value={d} onChange={e=>{setD(e.target.value);setSd("")}} data-testid={`${kind}-disposition`}><option value="">Select disposition</option>{Object.keys(dispositions).map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Sub-Disposition *<select value={sd} onChange={e=>setSd(e.target.value)} disabled={!d} data-testid={`${kind}-sub-disposition`}><option value="">Select sub-disposition</option>{(dispositions[d] || []).map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Agent Remark *<textarea value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Enter reason for this action" data-testid={`${kind}-remark`}/></label>
    <label className="upload">Evidence {need && <em>* Required</em>}<input type="file" accept="image/*,video/*" onChange={()=>setEvidence(true)} data-testid={`${kind}-evidence`}/></label>
    <button className="primary wide" onClick={submit} data-testid={`${kind}-submit-button`}>SUBMIT & MOVE TO PRIORITY</button>
  </div></div>;
}

function DraftModal({ item, remaining, tickElapsed, active, onCancel, onSubmit }) {
  const [d, setD] = useState(draftBlank);
  const ready = Object.values(d).every(Boolean);
  return <div className="modal-backdrop"><div className="modal confirm">
    <button className="modal-close" onClick={onCancel}><X size={18}/></button>
    <div className="eyebrow">TMA DRAFT UPLOAD</div>
    <h2>Complete Filing</h2>
    <p className="muted">{item?.name} · {item?.id}</p>
    <div className="draft-details" data-testid="tma-draft-details">
      <label>Add Remark<input value={d.remark} onChange={e=>setD({...d,remark:e.target.value})} placeholder="Type remark" data-testid="draft-remark"/></label>
      <label>Upload Draft *<input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e=>setD({...d,fileName:e.target.files?.[0]?.name || ""})} data-testid="draft-upload"/></label>
      <label>Brand Name *<input value={d.brandName} onChange={e=>setD({...d,brandName:e.target.value})} placeholder="Enter Brand Name" data-testid="draft-brand-name"/></label>
      <label>Class *<select value={d.className} onChange={e=>setD({...d,className:e.target.value})} data-testid="draft-class"><option value="">Select Class</option><option>Class 35</option><option>Class 42</option><option>Class 41</option></select></label>
      <label>Type *<select value={d.type} onChange={e=>setD({...d,type:e.target.value})} data-testid="draft-type"><option value="">Select Type</option><option>Word Mark</option><option>Device Mark</option><option>Combined Mark</option></select></label>
      <div className="draft-grid">
        <label>Next Followup Date *<input type="date" value={d.followupDate} onChange={e=>setD({...d,followupDate:e.target.value})} data-testid="draft-followup-date"/></label>
        <label>Next Followup Time *<input type="time" value={d.followupTime} onChange={e=>setD({...d,followupTime:e.target.value})} data-testid="draft-followup-time"/></label>
      </div>
      <label>Disposition *<select value={d.disposition} onChange={e=>setD({...d,disposition:e.target.value})} data-testid="draft-disposition"><option value="">Select Disposition</option><option>TMA Draft Uploaded</option><option>Awaiting Client Approval</option><option>Ready for Filing</option></select></label>
    </div>
    <div className="confirm-time">
      <span>{active.phase === "BUFFER" ? "Buffer Remaining" : "Time Remaining"}</span>
      <strong>{fmt(remaining)}</strong>
      <span>Total Elapsed</span>
      <strong className={active.phase === "BUFFER" ? "red-time" : "green-time"} data-testid="draft-elapsed-time">{fmt(tickElapsed)}</strong>
    </div>
    <div className="modal-actions">
      <button className="secondary" onClick={onCancel} data-testid="cancel-completion-button">CANCEL</button>
      <button className="primary" disabled={!ready} onClick={()=>ready && onSubmit(d)} data-testid="confirm-completion-button">SUBMIT & TRANSFER TO CALL SCHEDULE</button>
    </div>
  </div></div>;
}

function TrademarkYetToWork({ state, setState }) {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [showDraft, setShowDraft] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [successMsg, setSuccessMsg] = useState(null);
  const active = state.active && state.active.source === "tmr" ? state.active : null;
  useEffect(()=>{ if (!active) return; const t=setInterval(()=>setTick(Date.now()),1000); return()=>clearInterval(t) },[active]);
  useEffect(()=>{
    if (!active || active.frozen) return;
    const elapsed=Math.floor((Date.now()-active.startedAt)/1000);
    const remaining=active.phase === "BUFFER" ? active.bufferSeconds-elapsed : active.workSeconds-elapsed;
    if (remaining <= 0 && active.phase === "WORK") {
      setState(s=>({...s, active:{...s.active, phase:"BUFFER", startedAt:Date.now()}, audit:[...s.audit, `${now()} Buffer Started · ${active.oliId}`]}));
    } else if (remaining <= 0 && active.phase === "BUFFER") {
      setState(s => s.active && !s.active.frozen ? {...s, active: {...s.active, frozen: true, frozenAt: s.active.startedAt + s.active.bufferSeconds*1000}} : s);
      setModal({ type:"expired", item: state.tmrItems.find(x=>x.id===active.oliId) });
    }
  },[tick, active, setState, state.tmrItems]);

  const shown = useMemo(() => {
    const base = state.tmrItems.filter(x => x.status !== "COMPLETED");
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter(x => x.id.toLowerCase().includes(q) || x.name.toLowerCase().includes(q) || x.masterId.toLowerCase().includes(q));
  }, [state.tmrItems, query]);

  const activeItem = active ? state.tmrItems.find(x => x.id === active.oliId) : null;
  const effectiveNow = active ? (active.frozen ? active.frozenAt : tick) : Date.now();
  const phaseElapsed = active ? Math.max(0, Math.floor((effectiveNow - active.startedAt)/1000)) : 0;
  const remaining = active ? (active.phase === "BUFFER" ? active.bufferSeconds - phaseElapsed : active.workSeconds - phaseElapsed) : 0;
  const totalElapsed = active ? (active.phase === "BUFFER" ? active.workSeconds + phaseElapsed : phaseElapsed) : 0;

  const begin = (item) => {
    if (!item.assigned || state.active) return;
    setState(s=>({...s, active:{oliId:item.id, source:"tmr", phase:"WORK", startedAt:Date.now(), workSeconds:item.workMinutes*60, bufferSeconds:item.bufferMinutes*60, frozen:false, frozenAt:null}, tmrItems:s.tmrItems.map(x=>x.id===item.id?{...x,status:"IN_PROGRESS"}:x), audit:[...s.audit,`${now()} Work Started · ${item.id}`]}));
  };

  const freezeTimer = () => setState(s => s.active && !s.active.frozen ? {...s, active: {...s.active, frozen: true, frozenAt: Date.now()}} : s);
  const unfreezeTimer = () => setState(s => s.active && s.active.frozen ? {...s, active: {...s.active, frozen: false, startedAt: s.active.startedAt + (Date.now() - s.active.frozenAt), frozenAt: null}} : s);

  const openPause = () => { freezeTimer(); setModal({type:"pause", item: activeItem}); };
  const openComplete = () => { freezeTimer(); setShowDraft(true); };
  const cancelPause = () => { unfreezeTimer(); setModal(null); };
  const cancelDraft = () => { unfreezeTimer(); setShowDraft(false); };

  const finish = (draft) => {
    const item = activeItem;
    const bufferUsed = active.phase === "BUFFER";
    const withinTime = !bufferUsed;
    const capturedElapsed = active.frozen ? Math.max(0, Math.floor((active.frozenAt - active.startedAt)/1000)) : Math.floor((Date.now() - active.startedAt)/1000);
    const totalSec = bufferUsed ? active.workSeconds + capturedElapsed : capturedElapsed;
    const recovery = !!item.recovery;
    setState(s => ({
      ...s,
      active: null,
      tmrItems: s.tmrItems.map(x => x.id === item.id ? {...x, status: "COMPLETED", recovery: false, nextStage: "Call Schedule", draftDetails: draft, completionSeconds: totalSec, withinTime} : x),
      completedFilings: [...s.completedFilings, { id: item.id, name: item.name, masterId: item.masterId, service: item.service, state: item.state, amount: item.amount, package: item.package, draftDetails: draft, completedAt: `${today()} ${now()}`, agent: "Abhik Datta", bufferUsed, completionSeconds: totalSec, withinTime }],
      allCallSchedule: [...s.allCallSchedule, { id: item.id, name: item.name, masterId: item.masterId, service: item.service, draftDetails: draft, scheduledAt: `${today()} ${now()}`, agent: "Abhik Datta", callStatus: "Pending" }],
      completed: s.completed + 1,
      normalCompleted: s.normalCompleted + (recovery ? 0 : 1),
      priorityResolved: s.priorityResolved + (recovery ? 1 : 0),
      bufferCompleted: s.bufferCompleted + (bufferUsed ? 1 : 0),
      audit: [...s.audit, `${now()} TMA Draft Uploaded → Call Schedule · Completed in ${fmt(totalSec)}${bufferUsed ? " (Buffer Used)" : ""} · ${item.id}`]
    }));
    setShowDraft(false);
    setSuccessMsg(`Filing completed in ${fmt(totalSec)}${bufferUsed ? " (buffer used)" : ""} · ${item.id} · Follow-up scheduled for ${draft.followupDate} at ${draft.followupTime}`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const movePriority = (info, reason) => {
    const item = activeItem;
    const capturedElapsed = active.frozen ? Math.max(0, Math.floor((active.frozenAt - active.startedAt)/1000)) : Math.floor((Date.now() - active.startedAt)/1000);
    const totalSec = active.phase === "BUFFER" ? active.workSeconds + capturedElapsed : capturedElapsed;
    setState(s => ({
      ...s,
      active: null,
      tmrItems: s.tmrItems.map(x => x.id === item.id ? {...x, status: "PRIORITY"} : x),
      priority: [...s.priority, {...item, ...info, reason, elapsedSeconds: totalSec, bufferUsed: active.phase === "BUFFER", createdAt: now(), createdDate: today(), source: "tmr"}],
      audit: [...s.audit, `${now()} Moved to Priority · ${reason} · Elapsed ${fmt(totalSec)} · ${item.id}`]
    }));
    setModal(null);
  };

  return <div className="page">
    <div className="page-title">
      <div>
        <div className="breadcrumb">EMPLOYEE PANEL / TRADEMARK REGISTRATION</div>
        <h1 data-testid="tmr-yet-to-work-title">Trademark Registration (Not Done)</h1>
        <p>Your assigned Trademark filings. Click Start to begin Live Work.</p>
      </div>
      <div className="employee-chip"><UserRound size={17}/> Abhik Datta · Employee</div>
    </div>
    <Metrics state={state}/>
    {successMsg && <div className="success-banner" data-testid="finish-success-banner">✓ {successMsg}</div>}
    {active && activeItem && <section className={`active-work ${active.phase === "BUFFER" ? "buffer" : ""}`} data-testid="active-work-card">
      <div>
        <div className="eyebrow">ACTIVE LIVE WORK</div>
        <h2>{activeItem.name}</h2>
        <p>{active.oliId} · {activeItem.package} · ₹{activeItem.amount}</p>
      </div>
      <div className="timer-block">
        <span>{active.phase === "BUFFER" ? "BUFFER TIME" : "WORK TIME"}</span>
        <strong data-testid="live-work-timer">{fmt(remaining)}</strong>
        <small className={active.phase === "BUFFER" ? "red-time" : "green-time"}>Elapsed {fmt(totalElapsed)}</small>
      </div>
      <div className="active-actions">
        <button className="secondary" onClick={openPause} data-testid="pause-live-work-button"><Pause size={16}/> PAUSE</button>
        <button className="primary" onClick={openComplete} data-testid="complete-filing-button"><CheckSquare size={16}/> COMPLETE</button>
      </div>
    </section>}

    <section className="work-section">
      <div className="section-head">
        <div>
          <h2>Yet to Work Queue</h2>
          <p className="muted">All assigned Trademark Registration cases. No Master ID search required.</p>
        </div>
      </div>
      <div className="tmr-search">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="OLI ID, Mobile, Name, Email" data-testid="tmr-search-input"/>
        <button className="primary" data-testid="tmr-search-button">Search</button>
      </div>
      {shown.length === 0 ? <div className="empty" data-testid="tmr-empty">
        <FileText size={30}/>
        <strong>No matching Trademark filings</strong>
        <span>All assigned cases are completed or moved to Priority.</span>
      </div> : <div className="table-wrap">
        <table className="tmr-table">
          <thead><tr>
            <th>OLI ID</th><th>AGE</th><th>NAME</th><th>MASTER ID</th><th>STATE</th><th>AMOUNT</th><th>PACKAGE</th>
            <th>REMARK</th><th>CLICK TO CALL</th><th>CALLBACK SCHEDULE</th><th>RNR MAIL</th><th>STATUS</th><th>ACTION</th>
          </tr></thead>
          <tbody>{shown.map(item => <tr key={item.id} data-testid={`tmr-row-${item.id}`}>
            <td className="oli-id">{item.id}</td>
            <td>{item.age}</td>
            <td>{item.name}</td>
            <td>{item.masterId}</td>
            <td>{item.state}</td>
            <td>₹{item.amount}</td>
            <td><span className="package-tag">{item.package}</span></td>
            <td><button className="pill green">Remark</button></td>
            <td><button className="pill green"><Phone size={12}/> click to call</button></td>
            <td><button className="pill green">Callback Schedule</button></td>
            <td><button className="pill green">RNR Mail</button></td>
            <td>{item.status === "IN_PROGRESS" ? <span className="status in_progress" data-testid={`tmr-active-${item.id}`}>Active · {fmt(remaining)}</span> : <span className={`status ${item.status.toLowerCase()}`}>{item.status.replaceAll("_"," ")}</span>}</td>
            <td><button className={item.status === "YET_TO_WORK" && !state.active ? "start-btn" : "disabled-btn"} onClick={()=>begin(item)} disabled={item.status !== "YET_TO_WORK" || !!state.active} data-testid={`start-${item.id}-button`}><Play size={14}/> START</button></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>

    {modal && <DispositionModal kind={modal.type === "expired" ? "incomplete" : "pause"} item={modal.item} onCancel={modal.type === "expired" ? undefined : cancelPause} onSubmit={info=>movePriority(info, modal.type === "expired" ? "Buffer Expired" : "Paused by Agent")}/>}
    {showDraft && active && activeItem && <DraftModal item={activeItem} remaining={remaining} tickElapsed={totalElapsed} active={active} onCancel={cancelDraft} onSubmit={finish}/>}
  </div>;
}

function Priority({ state, setState }) {
  const nav = useNavigate();
  const transfer = (item) => {
    setState(s=>({ ...s, priority: s.priority.filter(x=>x.id!==item.id), tmrItems: s.tmrItems.map(x=>x.id===item.id?{...x, status:"YET_TO_WORK", recovery:true}:x), audit:[...s.audit, `${now()} Transferred to Trademark Yet to Work · ${item.id}`]}));
    setTimeout(() => nav("/employee/trademark-registration/yet-to-work"), 200);
  };
  return <div className="page">
    <div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / PRIORITY</div><h1 data-testid="priority-page-title">Priority Cases</h1><p>Cases requiring recovery or follow-up.</p></div><div className="priority-total"><strong data-testid="priority-page-count">{state.priority.length}</strong><span>open cases</span></div></div>
    <Metrics state={state}/>
    <section className="work-section">
      <div className="section-head"><div><h2>Priority Queue</h2><p className="muted">Paused and buffer-expired work remains visible until transferred.</p></div></div>
      {state.priority.length===0?<div className="empty"><BriefcaseBusiness size={30}/><strong>No priority cases</strong><span>Cases moved here from Live Work will appear in this queue.</span></div>:<div className="table-wrap"><table><thead><tr><th>PRIORITY #</th><th>OLI ID</th><th>NAME / SERVICE</th><th>REASON</th><th>SUB-DISPOSITION</th><th>REMARK</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>{state.priority.map((x,i)=><tr key={`${x.id}-${i}`} data-testid={`priority-row-${x.id}`}><td><span className="priority-number">#{i+1}</span></td><td className="oli-id">{x.id}</td><td>{x.name || x.service}<br/><small className="muted">{x.service}</small></td><td>{x.reason}</td><td>{x.subDisposition}</td><td className="remark">{x.remark}</td><td>{x.createdDate}<br/><small className="muted">{x.createdAt}</small></td><td><button className="start-btn" onClick={()=>transfer(x)} data-testid={`transfer-${x.id}-button`}><Play size={14}/> TRANSFER TO YET TO WORK</button></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function AllCallSchedule({ state }) {
  return <div className="page">
    <div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / ALL CALL SCHEDULE</div><h1 data-testid="acs-page-title">All Call Schedule</h1><p>Follow-ups scheduled with the client. Click Call Now to reach out.</p></div><div className="priority-total"><strong data-testid="acs-total-count">{state.allCallSchedule.length}</strong><span>scheduled calls</span></div></div>
    <Metrics state={state}/>
    <section className="work-section">
      <div className="section-head"><div><h2>Scheduled Calls</h2><p className="muted">Only the scheduled call information is shown here. Completion time and metrics live under Trademark Registration → Complete.</p></div></div>
      {state.allCallSchedule.length===0?<div className="empty" data-testid="acs-empty"><CalendarDays size={30}/><strong>No scheduled calls yet</strong><span>Trademark filings completed with TMA Draft Uploaded will appear here.</span></div>:<div className="table-wrap"><table><thead><tr><th>OLI ID</th><th>CUSTOMER</th><th>CALL DATE</th><th>CALL TIME</th><th>CALL STATUS</th><th>ACTION</th></tr></thead><tbody>{state.allCallSchedule.map((x,i)=><tr key={`${x.id}-${i}`} data-testid={`acs-row-${x.id}`}><td className="oli-id">{x.id}</td><td>{x.name || x.masterId}</td><td data-testid={`acs-call-date-${x.id}`}>{x.draftDetails.followupDate}</td><td data-testid={`acs-call-time-${x.id}`}>{x.draftDetails.followupTime}</td><td><span className="status in_progress">{x.callStatus || "Pending"}</span></td><td><button className="secondary" data-testid={`acs-call-${x.id}-button`}><Phone size={13}/> Call Now</button></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Dashboard({ state }) {
  return <div className="page dashboard">
    <div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / DASHBOARD</div><h1 data-testid="dashboard-title">Today&apos;s Work</h1><p>Good morning, Abhik. Here is your work summary.</p></div></div>
    <Metrics state={state}/>
    <div className="dashboard-grid">
      <div className="panel"><h2>Work overview</h2>
        <div className="overview-row"><span>Normal target completed</span><strong>{state.normalCompleted} / {state.target}</strong></div>
        <div className="overview-row"><span>Buffer used</span><strong>{state.bufferCompleted}</strong></div>
        <div className="overview-row"><span>Priority recovery</span><strong>{state.priorityResolved}</strong></div>
        <div className="overview-row"><span>Call Schedule</span><strong>{state.allCallSchedule.length}</strong></div>
      </div>
      <div className="panel"><h2>Recent activity</h2>
        {state.audit.length===0 ? <div className="muted" style={{padding:"14px 0"}}>No activity yet. Head to Trademark Registration → Yet to Work to start.</div> : state.audit.slice(-6).reverse().map(x=><div className="activity" key={x}><span className="dot"/>{x}</div>)}
      </div>
    </div>
  </div>;
}

function App() {
  const [state, setState] = useState(() => ({
  ...initial,
  tmrItems: buildTmrSeed(),
  active: null,
  priority: [],
  allCallSchedule: [],
  completedFilings: [],
  audit: [],
  target: 7,
  completed: 0,
  normalCompleted: 0,
  bufferCompleted: 0,
  priorityResolved: 0
}));
  // Demo mode: changes are intentionally not persisted across reloads.
  return <BrowserRouter><Shell state={state}>
    <Routes>
      <Route path="/employee/priority" element={<Priority state={state} setState={setState}/>}/>
      <Route path="/employee/all-call-schedule" element={<AllCallSchedule state={state}/>}/>
      <Route path="/employee/trademark-registration/yet-to-work" element={<TrademarkYetToWork state={state} setState={setState}/>}/>
      <Route path="*" element={<Dashboard state={state}/>}/>
    </Routes>
  </Shell></BrowserRouter>;
}
export default App;
