import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { Bell, BriefcaseBusiness, CalendarDays, CheckSquare, ChevronDown, ClipboardList, Download, FileText, Grid2X2, Headphones, LayoutDashboard, Pause, Play, Search, UserRound, X } from "lucide-react";
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
const draftBlank = { remark:"", fileName:"", brandName:"", className:"", type:"", followupDate:"", followupTime:"", disposition:"" };
const initial = { items: buildSeed(), active: null, priority: [], allCallSchedule: [], audit: [], target: 7, completed: 0, normalCompleted: 0, bufferCompleted: 0, priorityResolved: 0 };
const load = () => { try { const s = JSON.parse(localStorage.getItem("oli-live-work-v2")); return s || initial; } catch { return initial; } };
const save = (state) => localStorage.setItem("oli-live-work-v2", JSON.stringify(state));
const fmt = (seconds) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const today = () => new Date().toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

function Shell({ state, children }) {
  const links = [
    ["Dashboard", "/employee/home/dashboard", LayoutDashboard],
    ["Multisale Request", "#", ClipboardList],
    ["CRM Mailbox", "#", Headphones],
    ["Happy Code", "#", CheckSquare],
    ["All Call Schedule", "/employee/all-call-schedule", CalendarDays],
    ["Pending for GPay", "#", CheckSquare],
    ["Paid GPay", "#", CheckSquare],
    ["Check Prospect Status", "#", CheckSquare],
    ["New Doc Panel", "#", Grid2X2],
    ["Live Work", "/employee/live-work", Play],
    ["Priority", "/employee/priority", BriefcaseBusiness],
    ["GST Registration", "#", Grid2X2],
    ["GST Modification", "#", Grid2X2],
    ["GST Cancellation", "#", Grid2X2],
    ["GST Return", "#", Grid2X2]
  ];
  return <div className="oli-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">O</span><strong>nlineLegalIndia</strong><sup>™</sup><small>Beta</small></div><div className="side-search">Search Side Menu Items <Search size={17}/></div><nav>{links.map(([label, path, Icon]) => path === "#" ? <div className={`side-link ${label === "CRM Mailbox" ? "active-old" : ""}`} key={label} data-testid={`sidebar-${label.toLowerCase().replaceAll(" ", "-")}`}><Icon size={16}/><span>{label}</span></div> : <NavLink key={label} to={path} className={({isActive}) => `side-link ${isActive ? "selected" : ""} ${label === "Live Work" ? "live-link" : ""}`} data-testid={`sidebar-${label.toLowerCase().replaceAll(" ", "-")}`}><Icon size={16}/><span>{label}</span>{label === "Priority" && <b className="badge" data-testid="priority-sidebar-badge">{state.priority.length}</b>}{label === "All Call Schedule" && state.allCallSchedule.length > 0 && <b className="badge acs" data-testid="acs-sidebar-badge">{state.allCallSchedule.length}</b>}</NavLink>)}</nav></aside><main className="main"><header className="topbar"><div className="global-search"><select data-testid="global-search-option"><option>Select Search Option</option><option>OLI ID</option><option>Master ID</option></select><input placeholder="Search with OLI id, Email, Mobile" data-testid="global-search-input"/><button data-testid="global-search-button"><Search size={18}/></button></div><div className="top-icons"><BriefcaseBusiness/><span>0</span><Headphones className="red"/><Bell/><span>0</span><Download/><Bell/><div className="profile"><UserRound size={28}/><span>Abhik Datta</span><ChevronDown size={14}/></div></div></header>{children}</main></div>;
}

function Metrics({ state }) {
  const pct = Math.round((state.normalCompleted / state.target) * 100);
  const performance = state.normalCompleted >= state.target + 5 ? "EXCELLENT" : state.normalCompleted >= state.target + 3 ? "GREAT" : state.normalCompleted >= state.target + 1 ? "VERY GOOD" : state.normalCompleted >= state.target ? "GOOD" : "POOR";
  return <div className="metrics"><div><span>TARGET</span><strong data-testid="target-count">{state.target}</strong></div><div><span>COMPLETED</span><strong data-testid="completed-count">{state.normalCompleted}</strong></div><div><span>REMAINING</span><strong data-testid="remaining-count">{Math.max(0, state.target - state.normalCompleted)}</strong></div><div><span>PROGRESS</span><strong data-testid="completion-percent">{pct}%</strong></div><div><span>PRIORITY</span><strong data-testid="priority-count">{state.priority.length}</strong></div><div><span>PERFORMANCE</span><strong className="performance" data-testid="performance-label">{performance}</strong></div></div>;
}

function DispositionModal({ kind, item, onCancel, onSubmit }) {
  const [d, setD] = useState(""); const [sd, setSd] = useState(""); const [remark, setRemark] = useState(""); const [evidence, setEvidence] = useState(false);
  const need = requiresEvidence.includes(sd);
  const submit = () => { if (!d || !sd || !remark.trim() || (need && !evidence)) return; onSubmit({ disposition: d, subDisposition: sd, remark, evidence }); };
  return <div className="modal-backdrop"><div className="modal" data-testid={`${kind}-modal`}><button className="modal-close" onClick={onCancel} data-testid={`${kind}-modal-close`}><X size={18}/></button><div className="eyebrow">LIVE WORK</div><h2>{kind === "pause" ? "Pause Live Work" : "Work Not Completed"}</h2><p className="muted">{item?.id} · {item?.service}</p><label>Disposition *<select value={d} onChange={e=>{setD(e.target.value);setSd("")}} data-testid={`${kind}-disposition`}><option value="">Select disposition</option>{Object.keys(dispositions).map(x=><option key={x}>{x}</option>)}</select></label><label>Sub-Disposition *<select value={sd} onChange={e=>setSd(e.target.value)} disabled={!d} data-testid={`${kind}-sub-disposition`}><option value="">Select sub-disposition</option>{(dispositions[d] || []).map(x=><option key={x}>{x}</option>)}</select></label><label>Agent Remark *<textarea value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Enter reason for this action" data-testid={`${kind}-remark`}/></label><label className="upload">Evidence {need && <em>* Required</em>}<input type="file" accept="image/*,video/*" onChange={()=>setEvidence(true)} data-testid={`${kind}-evidence`}/></label><button className="primary wide" onClick={submit} data-testid={`${kind}-submit-button`}>SUBMIT & MOVE TO PRIORITY</button></div></div>;
}

function LiveWork({ state, setState }) {
  const nav = useNavigate();
  const [query, setQuery] = useState(""); const [submittedQuery, setSubmittedQuery] = useState("");
  const [modal, setModal] = useState(null); const [completeConfirm, setCompleteConfirm] = useState(false);
  const [draftDetails, setDraftDetails] = useState(draftBlank); const [tick, setTick] = useState(Date.now());
  const active = state.active;
  useEffect(()=>{ if (!active) return; const t=setInterval(()=>setTick(Date.now()),1000); return()=>clearInterval(t) },[active]);
  useEffect(()=>{ if (!active) return; const elapsed=Math.floor((Date.now()-active.startedAt)/1000); const remaining=active.phase === "BUFFER" ? active.bufferSeconds-elapsed : active.workSeconds-elapsed; if (remaining <= 0 && active.phase === "WORK") { setState(s=>({...s, active:{...s.active, phase:"BUFFER", startedAt:Date.now()}, audit:[...s.audit,`${now()} Buffer Started · ${active.oliId}`]})); } else if (remaining <= 0 && active.phase === "BUFFER") setModal({ type:"expired", item: state.items.find(x=>x.id===active.oliId) }); },[tick, active, setState, state.items]);
  const shown = useMemo(()=>{ if (!submittedQuery.trim()) return []; const q = submittedQuery.trim().toLowerCase(); return state.items.filter(x => x.status !== "COMPLETED" && (x.masterId.toLowerCase().includes(q) || x.id.toLowerCase().includes(q))); },[state.items, submittedQuery]);
  const bannerMaster = shown[0]?.masterId;
  const submitSearch = () => setSubmittedQuery(query);
  const begin = (item) => { if (!item.assigned || state.active) return; setState(s=>({...s, active:{oliId:item.id, phase:"WORK", startedAt:Date.now(), workSeconds:item.workMinutes*60, bufferSeconds:item.bufferMinutes*60}, items:s.items.map(x=>x.id===item.id?{...x,status:"IN_PROGRESS"}:x), audit:[...s.audit,`${now()} Work Started · ${item.id}`]})); };
  const isTrademark = active && state.items.find(x=>x.id===active.oliId)?.service === "Trademark Filing";
  const draftReady = () => Object.values(draftDetails).every(Boolean);
  const finish = (bufferUsed=false) => {
    const item=state.items.find(x=>x.id===active.oliId); const recovery=!!item?.recovery;
    if (isTrademark && !draftReady()) return;
    const goingToACS = isTrademark;
    setState(s=>({
      ...s,
      active:null,
      items: s.items.map(x=>x.id===item.id?{...x,status:"COMPLETED",recovery:false,nextStage: goingToACS ? "All Call Schedule" : "Completed", draftDetails: goingToACS ? draftDetails : null}:x),
      allCallSchedule: goingToACS ? [...s.allCallSchedule, { id: item.id, masterId: item.masterId, service: item.service, draftDetails, completedAt: `${today()} ${now()}`, agent: "Abhik Datta", bufferUsed }] : s.allCallSchedule,
      completed: s.completed+1,
      normalCompleted: s.normalCompleted+(recovery?0:1),
      priorityResolved: s.priorityResolved+(recovery?1:0),
      bufferCompleted: s.bufferCompleted+(bufferUsed?1:0),
      audit: [...s.audit, `${now()} ${goingToACS ? "TMA Draft Uploaded → All Call Schedule" : "Work Completed"}${bufferUsed?" · Buffer Used":""}${recovery?" · Priority Recovery":""} · ${item.id}`]
    }));
    setCompleteConfirm(false); setDraftDetails(draftBlank);
    if (goingToACS) setTimeout(()=>nav("/employee/all-call-schedule"), 300);
  };
  const movePriority = (info, reason) => { const item=state.items.find(x=>x.id===active.oliId); setState(s=>({...s, active:null, items: s.items.map(x=>x.id===item.id?{...x,status:"PRIORITY"}:x), priority:[...s.priority, {...item, ...info, reason, createdAt: now()}], audit:[...s.audit, `${now()} Moved to Priority · ${reason} · ${item.id}`]})); setModal(null); };
  const remaining = active ? (active.phase === "BUFFER" ? active.bufferSeconds - Math.floor((tick-active.startedAt)/1000) : active.workSeconds - Math.floor((tick-active.startedAt)/1000)) : 0;
  return <div className="page"><div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / LIVE WORK</div><h1>Live Work</h1><p>Search your assigned filings and manage work time.</p></div><div className="employee-chip"><UserRound size={17}/> Abhik Datta · Employee</div></div><Metrics state={state}/>{active && <section className={`active-work ${active.phase === "BUFFER" ? "buffer" : ""}`} data-testid="active-work-card"><div><div className="eyebrow">ACTIVE LIVE WORK</div><h2>{state.items.find(x=>x.id===active.oliId)?.service}</h2><p>{active.oliId}</p></div><div className="timer-block"><span>{active.phase === "BUFFER" ? "BUFFER TIME" : "TIME REMAINING"}</span><strong data-testid="live-work-timer">{fmt(remaining)}</strong></div><div className="active-actions"><button className="secondary" onClick={()=>setModal({type:"pause",item:state.items.find(x=>x.id===active.oliId)})} data-testid="pause-live-work-button"><Pause size={16}/> PAUSE</button><button className="primary" onClick={()=>setCompleteConfirm(true)} data-testid="complete-filing-button"><CheckSquare size={16}/> COMPLETE FILING</button></div></section>}<section className="work-section"><div className="section-head"><div><h2>Find Live Work</h2><p className="muted">Search by Master OLI ID or individual OLI ID to load assigned filings</p></div><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitSearch()} placeholder="Enter Master OLI ID or OLI ID" data-testid="live-work-search-input"/><button className="primary" onClick={submitSearch} data-testid="live-work-search-button">Search</button></div></div>{!submittedQuery.trim() ? <div className="empty search-empty" data-testid="live-work-empty-state"><Search size={30}/><strong>Search to load Live Work</strong><span>Enter a Master OLI ID (e.g. O4560674177LI) or individual OLI ID to see assigned filings.</span></div> : shown.length === 0 ? <div className="empty" data-testid="live-work-no-results"><FileText size={30}/><strong>No filings found</strong><span>No records match “{submittedQuery}”.</span></div> : <><div className="result-banner"><strong data-testid="live-work-result-count">{shown.length} OLI IDs</strong><span>Master ID: {bannerMaster}</span><small>Assigned to you: {shown.filter(x=>x.assigned).length}</small></div><div className="table-wrap"><table><thead><tr><th>OLI ID</th><th>SERVICE</th><th>ASSIGNED</th><th>STATUS</th><th>WORK / BUFFER</th><th>ACTION</th></tr></thead><tbody>{shown.map(item=><tr key={item.id} data-testid={`live-work-row-${item.id}`}><td className="oli-id">{item.id}</td><td>{item.service}</td><td>{item.assigned?<span className="assigned">● Me</span>:<span className="muted">Not Assigned</span>}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status.replaceAll("_", " ")}</span></td><td>{item.workMinutes} min / {item.bufferMinutes} min</td><td><button className={item.assigned && !state.active && item.status === "YET_TO_WORK" ? "start-btn" : "disabled-btn"} onClick={()=>begin(item)} disabled={!item.assigned || !!state.active || item.status !== "YET_TO_WORK"} data-testid={`start-${item.id}-button`}><Play size={14}/> START</button></td></tr>)}</tbody></table></div></>}</section>
  {modal && <DispositionModal kind={modal.type === "expired" ? "incomplete" : "pause"} item={modal.item} onCancel={()=>setModal(null)} onSubmit={info=>movePriority(info, modal.type === "expired" ? "Buffer Expired" : "Paused by Agent")}/>}
  {completeConfirm && <div className="modal-backdrop"><div className="modal confirm"><div className="eyebrow">{isTrademark ? "TRANSFER TO NEXT STAGE" : "CONFIRM COMPLETION"}</div><h2>{isTrademark ? "TMA Draft Uploaded" : "Complete Filing?"}</h2><p>{isTrademark ? "This filing will move to All Call Schedule for the next stage." : "You are marking this filing as completed."}</p>
  {isTrademark && <div className="draft-details" data-testid="tma-draft-details">
    <label>Add Remark<input value={draftDetails.remark} onChange={e=>setDraftDetails({...draftDetails,remark:e.target.value})} placeholder="Type remark" data-testid="draft-remark"/></label>
    <label>Upload Draft *<input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e=>setDraftDetails({...draftDetails,fileName:e.target.files?.[0]?.name || ""})} data-testid="draft-upload"/></label>
    <label>Brand Name *<input value={draftDetails.brandName} onChange={e=>setDraftDetails({...draftDetails,brandName:e.target.value})} placeholder="Enter Brand Name" data-testid="draft-brand-name"/></label>
    <label>Class *<select value={draftDetails.className} onChange={e=>setDraftDetails({...draftDetails,className:e.target.value})} data-testid="draft-class"><option value="">Select Class</option><option>Class 35</option><option>Class 42</option><option>Class 41</option></select></label>
    <label>Type *<select value={draftDetails.type} onChange={e=>setDraftDetails({...draftDetails,type:e.target.value})} data-testid="draft-type"><option value="">Select Type</option><option>Word Mark</option><option>Device Mark</option><option>Combined Mark</option></select></label>
    <div className="draft-grid"><label>Next Followup Date *<input type="date" value={draftDetails.followupDate} onChange={e=>setDraftDetails({...draftDetails,followupDate:e.target.value})} data-testid="draft-followup-date"/></label><label>Next Followup Time *<input type="time" value={draftDetails.followupTime} onChange={e=>setDraftDetails({...draftDetails,followupTime:e.target.value})} data-testid="draft-followup-time"/></label></div>
    <label>Disposition *<select value={draftDetails.disposition} onChange={e=>setDraftDetails({...draftDetails,disposition:e.target.value})} data-testid="draft-disposition"><option value="">Select Disposition</option><option>TMA Draft Uploaded</option><option>Awaiting Client Approval</option><option>Ready for Filing</option></select></label>
  </div>}
  <div className="confirm-time"><span>{active.phase === "BUFFER" ? "Buffer Remaining" : "Time Remaining"}</span><strong>{fmt(remaining)}</strong><span>Buffer Used</span><strong>{active.phase === "BUFFER" ? "Yes" : "No"}</strong></div>
  <div className="modal-actions"><button className="secondary" onClick={()=>{setCompleteConfirm(false);setDraftDetails(draftBlank)}} data-testid="cancel-completion-button">CANCEL</button><button className="primary" onClick={()=>finish(active.phase === "BUFFER")} data-testid="confirm-completion-button">{isTrademark ? "SUBMIT & TRANSFER" : "CONFIRM COMPLETION"}</button></div></div></div>}</div>;
}

function Priority({ state, setState }) {
  const transfer = (item) => setState(s=>({ ...s, priority: s.priority.filter(x=>x.id!==item.id), items: s.items.map(x=>x.id===item.id?{...x, status:"YET_TO_WORK", recovery:true}:x), audit:[...s.audit, `${now()} Transferred to Live Work · ${item.id}`]}));
  return <div className="page"><div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / PRIORITY</div><h1 data-testid="priority-page-title">Priority Cases</h1><p>Cases requiring recovery or follow-up.</p></div><div className="priority-total"><strong data-testid="priority-page-count">{state.priority.length}</strong><span>open cases</span></div></div><Metrics state={state}/><section className="work-section"><div className="section-head"><div><h2>Priority Queue</h2><p className="muted">Paused and buffer-expired work remains visible until transferred.</p></div></div>{state.priority.length===0?<div className="empty"><BriefcaseBusiness size={30}/><strong>No priority cases</strong><span>Cases moved here from Live Work will appear in this queue.</span></div>:<div className="table-wrap"><table><thead><tr><th>PRIORITY #</th><th>OLI ID</th><th>SERVICE</th><th>REASON</th><th>SUB-DISPOSITION</th><th>REMARK</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>{state.priority.map((x,i)=><tr key={`${x.id}-${i}`} data-testid={`priority-row-${x.id}`}><td><span className="priority-number">#{i+1}</span></td><td className="oli-id">{x.id}</td><td>{x.service}</td><td>{x.reason}</td><td>{x.subDisposition}</td><td className="remark">{x.remark}</td><td>{x.createdAt}</td><td><button className="start-btn" onClick={()=>transfer(x)} data-testid={`transfer-${x.id}-button`}><Play size={14}/> TRANSFER TO LIVE WORK</button></td></tr>)}</tbody></table></div>}</section></div>;
}

function AllCallSchedule({ state }) {
  return <div className="page"><div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / ALL CALL SCHEDULE</div><h1 data-testid="acs-page-title">All Call Schedule</h1><p>Trademark filings transferred with TMA Draft Uploaded. Follow-ups scheduled below.</p></div><div className="priority-total"><strong data-testid="acs-total-count">{state.allCallSchedule.length}</strong><span>scheduled calls</span></div></div><Metrics state={state}/><section className="work-section"><div className="section-head"><div><h2>Scheduled Calls</h2><p className="muted">All Trademark cases queued for client call and next-stage action.</p></div></div>{state.allCallSchedule.length===0?<div className="empty" data-testid="acs-empty"><CalendarDays size={30}/><strong>No scheduled calls yet</strong><span>Trademark filings completed with TMA Draft Uploaded will appear here.</span></div>:<div className="table-wrap"><table><thead><tr><th>OLI ID</th><th>MASTER ID</th><th>BRAND NAME</th><th>CLASS</th><th>TYPE</th><th>DRAFT FILE</th><th>FOLLOWUP</th><th>DISPOSITION</th><th>COMPLETED AT</th><th>AGENT</th><th>ACTION</th></tr></thead><tbody>{state.allCallSchedule.map((x,i)=><tr key={`${x.id}-${i}`} data-testid={`acs-row-${x.id}`}><td className="oli-id">{x.id}</td><td>{x.masterId}</td><td>{x.draftDetails.brandName}</td><td>{x.draftDetails.className}</td><td>{x.draftDetails.type}</td><td className="draft-file"><FileText size={13}/> {x.draftDetails.fileName}</td><td>{x.draftDetails.followupDate} · {x.draftDetails.followupTime}</td><td><span className="status in_progress">{x.draftDetails.disposition}</span></td><td>{x.completedAt}</td><td>{x.agent}</td><td><button className="secondary" data-testid={`acs-call-${x.id}-button`}><Play size={13}/> SCHEDULE CALL</button></td></tr>)}</tbody></table></div>}</section></div>;
}

function Dashboard({ state }) {
  return <div className="page dashboard"><div className="page-title"><div><div className="breadcrumb">EMPLOYEE PANEL / DASHBOARD</div><h1 data-testid="dashboard-title">Today&apos;s Work</h1><p>Good morning, Abhik. Here is your work summary.</p></div></div><Metrics state={state}/><div className="dashboard-grid"><div className="panel"><h2>Work overview</h2><div className="overview-row"><span>Normal target completed</span><strong>{state.normalCompleted} / {state.target}</strong></div><div className="overview-row"><span>Buffer used</span><strong>{state.bufferCompleted}</strong></div><div className="overview-row"><span>Priority recovery</span><strong>{state.priorityResolved}</strong></div><div className="overview-row"><span>All Call Schedule</span><strong>{state.allCallSchedule.length}</strong></div></div><div className="panel"><h2>Recent activity</h2>{state.audit.length===0 ? <div className="muted" style={{padding:"14px 0"}}>No activity yet. Head to Live Work to start.</div> : state.audit.slice(-6).reverse().map(x=><div className="activity" key={x}><span className="dot"/>{x}</div>)}</div></div></div>;
}

function App() {
  const [state, setState] = useState(load);
  useEffect(()=>save(state),[state]);
  return <BrowserRouter><Shell state={state}>
    <Routes>
      <Route path="/employee/priority" element={<Priority state={state} setState={setState}/>}/>
      <Route path="/employee/all-call-schedule" element={<AllCallSchedule state={state}/>}/>
      <Route path="/employee/live-work/*" element={<LiveWork state={state} setState={setState}/>}/>
      <Route path="*" element={<Dashboard state={state}/>}/>
    </Routes>
  </Shell></BrowserRouter>;
}
export default App;
