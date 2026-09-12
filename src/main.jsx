import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, BarChart3, Camera, CheckCircle2, ChevronRight, CircleAlert, ClipboardCheck, Clock3, Droplets, FileText, Footprints, Gauge, LayoutDashboard, Map, MapPin, Menu, Navigation, Search, ShieldCheck, Sparkles, Star, Toilet, Users, Wrench, X } from 'lucide-react';
import './styles.css';

// VIT Vellore campus building geotags. Change a building's floors value to regenerate its prototype coverage.
export const campusBuildings = [
  ['anna-audi','Anna Audi',12.970050580202205,79.15563304696111],['mgr-block','Dr MGR Block',12.968984347769862,79.15592516730672],['channa-reddy','Channa Reddy Block',12.969010753649732,79.15618070055872],['periyar-library','Periyar Library',12.969143110307428,79.1568890355365],['smv','SMV',12.969656084142041,79.15774572229465],['narayani-health','Sri Narayani Health Centre',12.96948426086621,79.15478707892352],['gd-naidu','G.D. Naidu Block',12.969729150583913,79.15481837295958],['technology-towers','Technology Towers',12.971009909599799,79.15949108990554],['ambedkar-auditorium','Ambedkar Auditorium',12.970618681480833,79.15936027323889],['silver-jubilee','Silver Jubilee Tower',12.971289041305319,79.16365086010413],['sjt-annexe','SJT Annexe',12.970634601042937,79.16362848855013],['prp-a','PRP A Block',12.971977943887374,79.16651999916304],['prp-b','PRP B Block',12.971442913816727,79.1667334000202],['prp-c','PRP C Block',12.971065363597342,79.16632938868905],['prp-d','PRP D Block',12.971281395072902,79.16590258697201],['prp-e','PRP E Block',12.971812387535689,79.16599374850007],['prp-annexe','PRP Annexe',12.971281395072241,79.1671332676574],['gandhi-block','Gandhi Block',12.972349435798796,79.1679454340396]
].map(([id,name,latitude,longitude])=>({id,name,latitude,longitude,floors:3}));
const campusToilets=campusBuildings.flatMap((b,index)=>Array.from({length:b.floors},(_,f)=>[1,2].map(n=>{const score=45+(index*17+(f+1)*11+n*7)%51;return {id:`${b.id}-f${f+1}-w${n}`,name:`${b.name} · Floor ${f+1} · Toilet ${n}`,buildingId:b.id,buildingName:b.name,floor:f+1,toiletNumber:n,latitude:b.latitude+(n===1?.000018:-.000018),longitude:b.longitude+(n===1?.000018:-.000018),zone:'VIT Vellore',location:`Floor ${f+1} · Toilet ${n}`,thiScore:score,predictedThi:Math.max(20,score-(index+f+n)%16),lastCleaned:['20 min ago','45 min ago','1.5h ago','2.5h ago'][(index+f+n)%4],complaints:(index+f+n)%5,footfall:45+(index*17+f*13+n*9)%120,topIssue:['Cleanliness','Water','Blockage','Waste'][(index+f+n)%4],priority:score<55?'Critical':score<75?'High':'Low',accessibility:n===1,citizenTrustScore:Math.min(96,score+5),slaStatus:score<55?'At risk':'On track'};}))).flat();
const toilets = campusToilets; // One shared state powers citizen reports, authority actions, and the map.
let seedComplaints=[
  {id:'CMP-241',toiletId:'TL-105',category:'Water',text:'No water in both washbasins and the flush is not working.',time:'8 min ago',status:'New',tag:'Recurring',systemic:true},
  {id:'CMP-240',toiletId:'TL-102',category:'Cleanliness',text:'Floor is wet and cubicles need urgent cleaning.',time:'22 min ago',status:'Assigned',tag:'High footfall',systemic:false},
  {id:'CMP-239',toiletId:'TL-105',category:'Blockage',text:'Toilet is blocked and unusable near the metro exit.',time:'37 min ago',status:'New',tag:'Systemic',systemic:true},
  {id:'CMP-238',toiletId:'TL-107',category:'Cleanliness',text:'Bins are overflowing near the entrance.',time:'1h ago',status:'In progress',tag:'Recurring',systemic:true},
  {id:'CMP-237',toiletId:'TL-104',category:'Waste',text:'Waste collection has not happened this afternoon.',time:'1h ago',status:'New',tag:'Service gap',systemic:false},
  {id:'CMP-236',toiletId:'TL-108',category:'Electricity',text:'Lights are flickering inside the facility.',time:'2h ago',status:'Resolved',tag:'Infrastructure',systemic:false}
];
seedComplaints=seedComplaints.map((complaint,index)=>({...complaint,toiletId:campusToilets[index].id}));
const accessSeed=Object.fromEntries(campusToilets.map((t,i)=>[t.id,{ramp:t.accessibility,rails:true,door:i%3!==0,lighting:i%4!==0,mh:i%2===0}]));

const AppContext = createContext();
function AppProvider({children}) { const [data,setData]=useState(toilets); const [complaintData,setComplaintData]=useState(seedComplaints); const [accessibility,setAccessibility]=useState(accessSeed); const [eventApplied,setEventApplied]=useState(false); const [toast,setToast]=useState(''); const notify=message=>{setToast(message);setTimeout(()=>setToast(''),3500)}; const report=(id,issue)=>{const ticket='TL-'+Math.random().toString(36).slice(2,7).toUpperCase();setData(ds=>ds.map(t=>t.id===id?{...t,complaints:t.complaints+1,topIssue:issue,thiScore:Math.max(18,t.thiScore-4),predictedThi:Math.max(12,t.predictedThi-7),priority:t.predictedThi-7<40?'Critical':'High',slaStatus:'At risk',assignmentStatus:'New report awaiting dispatch'}:t));setComplaintData(cs=>[{id:`CMP-${ticket.slice(-3)}`,toiletId:id,category:issue,text:`Citizen report: ${issue} needs attention.`,time:'Just now',status:'New',tag:'New signal',systemic:false},...cs]);notify(`Report ${ticket} created and routed to operations`);return ticket}; const assignCrew=id=>{setData(ds=>ds.map(t=>t.id===id?{...t,assignedCrew:'Crew 4',assignmentStatus:'Assigned · Crew arriving',slaStatus:t.slaStatus==='Breached'?'At risk':'On track'}:t));notify('Crew 4 assigned; SLA window refreshed')}; const markCleaned=id=>{setData(ds=>ds.map(t=>t.id===id?{...t,lastCleaned:'Just now',thiScore:Math.min(96,t.thiScore+20),predictedThi:Math.min(91,t.predictedThi+20),complaints:0,topIssue:'None',priority:'Low',slaStatus:'On track',assignmentStatus:'Completed'}:t));setComplaintData(cs=>cs.map(c=>c.toiletId===id&&c.status!=='Resolved'?{...c,status:'Resolved',tag:'Resolved'}:c));notify('Facility marked clean; linked complaints resolved')}; const inspect=id=>{setData(ds=>ds.map(t=>t.id===id?{...t,assignmentStatus:'Inspection requested'}:t));notify('Inspection request sent to field supervisor')}; const flagRepair=id=>{setData(ds=>ds.map(t=>t.id===id?{...t,topIssue:'Infrastructure repair',priority:'High',assignmentStatus:'Repair flagged',slaStatus:'At risk'}:t));notify('Facility flagged for repair')}; const updateComplaint=(id,mode)=>{setComplaintData(cs=>cs.map(c=>c.id===id?{...c,status:mode==='assign'?'Assigned':mode==='escalate'?'Escalated':c.status,tag:mode==='systemic'?'Systemic':c.tag,systemic:mode==='systemic'?true:c.systemic}:c));notify(mode==='assign'?'Complaint assigned to Crew 4':mode==='escalate'?'Complaint escalated to supervisor':'Marked as a systemic issue')}; const applyEventRecommendations=()=>{setData(ds=>ds.map(t=>t.zone==='Central'?{...t,footfall:Math.round(t.footfall*1.8),predictedThi:Math.max(15,t.predictedThi-15),priority:t.predictedThi-15<40?'Critical':'High',slaStatus:'At risk',assignmentStatus:'Festival readiness applied'}:t));setEventApplied(true);notify('Festival recommendations applied to Central zone')}; const updateAccess=(id,key,value)=>{setAccessibility(a=>({...a,[id]:{...a[id],[key]:value}}));notify('Accessibility assessment updated — THI unchanged')}; return <AppContext.Provider value={{data,complaintData,accessibility,eventApplied,report,assignCrew,markCleaned,inspect,flagRepair,updateComplaint,applyEventRecommendations,updateAccess,toast}}>{children}</AppContext.Provider> }
const useApp=()=>useContext(AppContext);
const status = score => score>=75?'good':score>=55?'watch':'alert';
function StatusBadge({score,label}) { const s=status(score); return <span className={`badge ${s}`}><i/> {label || (s==='good'?'Good':s==='watch'?'Needs attention':'Urgent')}</span> }
function AccessibilityBadge({active}) { return active?<span className="access"><span aria-hidden>♿</span> Accessible</span>:<span className="muted">No accessibility data</span> }
function IssueChip({children}) { return <span className="chip">{children}</span> }
function MetricCard({icon:Icon,label,value,detail}) { return <div className="metric"><div className="metric-icon"><Icon size={18}/></div><div><small>{label}</small><strong>{value}</strong>{detail&&<span>{detail}</span>}</div></div> }
function THICard({toilet}) { return <section className="thi-card"><div className="thi-top"><div><p className="eyebrow">TOILET HEALTH INDEX</p><div className="score-line"><strong>{toilet.thiScore}</strong><span>/100</span><StatusBadge score={toilet.thiScore}/></div><p className="muted">Updated just now · {toilet.name}</p></div><div className={`ring ${status(toilet.thiScore)}`} style={{'--score':`${toilet.thiScore * 3.6}deg`}}><span>{toilet.thiScore}</span></div></div><div className="insight-row"><IssueChip>↑ 41% higher footfall than usual</IssueChip><IssueChip>{toilet.complaints} complaints in 2 hours</IssueChip><IssueChip>3.5h since last cleaning</IssueChip></div><div className="prediction"><Sparkles size={17}/><span>Predicted THI in 3 hours</span><strong>{toilet.predictedThi}/100</strong><ChevronRight size={17}/></div></section> }
function PriorityCard({toilet}) { return <div className="priority-card"><div><p className="eyebrow">PRIORITY</p><strong>{toilet.priority}</strong><span>{toilet.topIssue}</span></div><StatusBadge score={toilet.thiScore}/></div> }
function ComplaintCard({toilet}) { return <div className="complaint-card"><CircleAlert size={18}/><div><strong>{toilet.complaints} active complaints</strong><span>Top issue: {toilet.topIssue}</span></div></div> }
function SLAProgress({toilet}) { const pct=toilet.slaStatus==='Breached'?100:toilet.slaStatus==='At risk'?82:48; return <div className="sla"><div><span>SLA status</span><strong className={toilet.slaStatus==='Breached'?'red':''}>{toilet.slaStatus}</strong></div><div className="progress"><i style={{width:`${pct}%`}}/></div></div> }
function FootfallChart({toilet}) { const values=[35,48,39,58,70,84,62];return <section className="chart-card"><div className="section-head"><div><h3>Footfall today</h3><p>{toilet.footfall} visitors</p></div><Footprints size={19}/></div><div className="bars">{values.map((v,i)=><i key={i} style={{height:`${v}%`}}/> )}</div><div className="chart-labels"><span>6am</span><span>Now</span><span>6pm</span></div></section> }
function THIChart({toilet}) { const pts=`0,82 38,68 75,74 112,50 150,${100-toilet.thiScore} 190,45 230,38`;return <section className="chart-card"><div className="section-head"><div><h3>Health trend</h3><p>Last 6 hours</p></div><StatusBadge score={toilet.thiScore}/></div><svg viewBox="0 0 230 100" preserveAspectRatio="none"><polyline points={pts}/><line x1="0" y1="72" x2="230" y2="72"/></svg><div className="chart-labels"><span>6h ago</span><span>Now</span></div></section> }
function Button({children,variant='primary',...props}) { return <button className={`button ${variant}`} {...props}>{children}</button> }
function Tabs({active,setActive}) {return <div className="tabs">{['Nearby','All toilets'].map(x=><button key={x} onClick={()=>setActive(x)} className={active===x?'active':''}>{x}</button>)}</div>}
function CampusMap({authority=false}){
  const {data}=useApp();
  const nav=useNavigate();

  const [buildingId,setBuildingId]=useState();
  const [floor,setFloor]=useState('all');
  const [query,setQuery]=useState('');
  const [cleanest,setCleanest]=useState(false);

  const building=campusBuildings.find(b=>b.id===buildingId);

  const toiletsForBuilding=data.filter(
    t=>t.buildingId===buildingId &&
    (floor==='all'||t.floor===+floor)
  );

  const best=[...data].sort(
    (a,b)=>b.thiScore-a.thiScore||a.complaints-b.complaints
  )[0];

  const find=()=>{
    const q=query.toLowerCase();

    const t=data.find(
      x=>x.name.toLowerCase().includes(q)||
      `floor ${x.floor} toilet ${x.toiletNumber}`.includes(q)
    );

    const b=campusBuildings.find(
      x=>x.name.toLowerCase().includes(q)
    );

    if(t||b){
      setBuildingId(t?.buildingId||b.id);
      setFloor('all');
    }
  };

  const buildingIcon=L.divIcon({
    className:'custom-building-marker',
    html:'<div>📍</div>',
    iconSize:[30,30],
    iconAnchor:[15,30]
  });

  const toiletIcon=(score)=>L.divIcon({
    className:'custom-toilet-marker',
    html:`<div class="toilet-marker ${status(score)}"></div>`,
    iconSize:[16,16],
    iconAnchor:[8,8]
  });

  return (
    <section className="campus-map-shell">

      <div className="campus-map-toolbar">
        <label>
          DATA SOURCE
          <select defaultValue="Campus Data">
            <option>Demo Data</option>
            <option>Campus Data</option>
          </select>
        </label>

        <b>Campus Data • VIT Vellore • Prototype</b>

        <div>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&find()}
            placeholder="Search campus building or toilet…"
          />
          <button onClick={find}>
            <Search size={15}/>
          </button>
        </div>
      </div>

      <p className="map-prototype-note">
        18 mapped buildings · 2 toilets / floor · Toilet locations are estimated for MVP demonstration.
      </p>

      <div className="campus-map">

        <MapContainer
          center={[12.9707,79.1613]}
          zoom={16}
          scrollWheelZoom={true}
          style={{height:'100%',width:'100%'}}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {campusBuildings.map(b=>(
            <Marker
              key={b.id}
              position={[b.latitude,b.longitude]}
              icon={buildingIcon}
              eventHandlers={{
                click:()=>{
                  setBuildingId(b.id);
                  setFloor('all');
                }
              }}
            >
              <Popup>
                <strong>{b.name}</strong>
                <br/>
                {b.floors} floors
                <br/>
                {b.floors*2} prototype toilets
              </Popup>
            </Marker>
          ))}

          {toiletsForBuilding.map(t=>(
            <Marker
              key={t.id}
              position={[t.latitude,t.longitude]}
              icon={toiletIcon(t.thiScore)}
              eventHandlers={{
                click:()=>{
                  nav(
                    authority
                    ? `/authority/toilet/${t.id}`
                    : `/toilet/${t.id}`
                  );
                }
              }}
            >
              <Popup>
                Floor {t.floor} · Toilet {t.toiletNumber}
                <br/>
                THI: {t.thiScore}
              </Popup>
            </Marker>
          ))}

        </MapContainer>

        <div className="map-legend">
          <span>
            <i className="legend-good"/> Good
          </span>
          <span>
            <i className="legend-watch"/> Needs attention
          </span>
          <span>
            <i className="legend-alert"/> Cleaning required
          </span>
        </div>

      </div>

      <button
        className="cleanest"
        onClick={()=>setCleanest(!cleanest)}
      >
        <Sparkles size={15}/>
        Cleanest nearby
      </button>

      {cleanest&&(
        <div className="best-campus">
          <small>BEST AVAILABLE</small>
          <strong>{best.buildingName}</strong>
          <span>
            Floor {best.floor} · Toilet {best.toiletNumber} · THI {best.thiScore}
          </span>
          <button
            onClick={()=>nav(
              authority
              ? `/authority/toilet/${best.id}`
              : `/toilet/${best.id}`
            )}
          >
            View
          </button>
        </div>
      )}

      {building&&(
        <aside className="campus-building-card">

          <h3>{building.name}</h3>

          <p>
            {building.floors} floors · {building.floors*2} prototype toilets
          </p>

          <p>
            Average THI: {
              Math.round(
                data
                  .filter(t=>t.buildingId===building.id)
                  .reduce((s,t)=>s+t.thiScore,0)/
                (building.floors*2)
              )
            }
          </p>

          <label>
            Floor
            <select
              value={floor}
              onChange={e=>setFloor(e.target.value)}
            >
              <option value="all">All Floors</option>

              {Array.from(
                {length:building.floors},
                (_,i)=>(
                  <option key={i} value={i+1}>
                    Floor {i+1}
                  </option>
                )
              )}

            </select>
          </label>

          <div>
            {toiletsForBuilding.map(t=>(
              <button
                key={t.id}
                onClick={()=>nav(
                  authority
                  ? `/authority/toilet/${t.id}`
                  : `/toilet/${t.id}`
                )}
              >
                <StatusBadge score={t.thiScore}/>
                Floor {t.floor} · Toilet {t.toiletNumber}
              </button>
            ))}
          </div>

        </aside>
      )}

    </section>
  );
}
function MapPanel(){return <CampusMap/>}
function Sidebar(){
  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
       <span><img src="/src/toilens-logo.png" alt="ToiLens" /></span>
      </Link>

      <p>Citizen portal</p>

      <nav>
        <Link to="/" className="nav-active">
          <Toilet/>Nearby toilets
        </Link>

        <Link to="/report">
          <FileText/>Report an issue
        </Link>
      </nav>

      <div className="sidebar-note">
        <ShieldCheck/>
        <strong>Better public sanitation, together.</strong>
        <span>Every report helps keep facilities ready.</span>
      </div>
    </aside>
  );
}
function BottomNavigation(){return <nav className="bottom-nav"><Link to="/" className="active"><Toilet/><span>Nearby</span></Link><Link to="/report"><CircleAlert/><span>Report</span></Link><a href="#profile"><Menu/><span>More</span></a></nav>}
function Modal({children}) {return <div className="modal-backdrop"><div className="modal">{children}</div></div>}
function Toast(){const {toast}=useApp();return toast?<div className="toast"><CheckCircle2/> {toast}</div>:null}
function ToiletRow({toilet}){return <Link to={`/toilet/${toilet.id}`} className="toilet-row"><div className={`mini-score ${status(toilet.thiScore)}`}>{toilet.thiScore}</div><div className="toilet-info"><strong>{toilet.name}</strong><span><MapPin size={13}/>{toilet.distance} · {toilet.location}</span><AccessibilityBadge active={toilet.accessibility}/></div><div className="row-end"><StatusBadge score={toilet.thiScore}/><ChevronRight/></div></Link>}
function Home(){
  const {data}=useApp();
  const [query,setQuery]=useState('');
  const [tab,setTab]=useState('Nearby');

  const visible=data
    .filter(t=>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.buildingName.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0,tab==='Nearby'?4:8);

  return (
    <Layout>
      <main>
        <header className="welcome">
          <div>
            <p className="eyebrow">VIT VELLORE</p>
            <h1>
              Find a cleaner toilet
              <br/>
              <em>when you need one.</em>
            </h1>
          </div>

          <span className="profile">AK</span>
        </header>

        <THICard toilet={data[0]}/>

        <section id="nearby" className="nearby">

          <div className="section-head">
            <div>
              <p className="eyebrow">CAMPUS</p>
              <h2>Nearby toilets</h2>
            </div>

            <button
              className="link-button"
              onClick={()=>setTab('All toilets')}
            >
              View all
            </button>
          </div>

          <div className="search">
            <Search size={18}/>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Search building or toilet"
            />
          </div>

          <Tabs
            active={tab}
            setActive={setTab}
          />

          <MapPanel/>

          <div className="toilet-list">
            {visible.map(t=>(
              <ToiletRow
                toilet={t}
                key={t.id}
              />
            ))}
          </div>

        </section>
      </main>
    </Layout>
  );
}
function Detail(){const {data}=useApp();const id=location.pathname.split('/').pop();const toilet=data.find(t=>t.id===id)||data[0];return <Layout><main><Link className="back" to="/">← Nearby toilets</Link><header className="detail-header"><div><p className="eyebrow">{toilet.zone} · {toilet.id}</p><h1>{toilet.name}</h1><p className="muted"><MapPin size={15}/>{toilet.location}</p></div><StatusBadge score={toilet.thiScore}/></header><THICard toilet={toilet}/><div className="details-grid"><PriorityCard toilet={toilet}/><ComplaintCard toilet={toilet}/><MetricCard icon={Footprints} label="Footfall today" value={toilet.footfall} detail="visitors"/><MetricCard icon={Wrench} label="Last cleaned" value={toilet.lastCleaned}/></div><SLAProgress toilet={toilet}/><div className="chart-grid"><FootfallChart toilet={toilet}/><THIChart toilet={toilet}/></div><Link to={`/report?toilet=${toilet.id}`}><Button><CircleAlert size={18}/> Report an issue here</Button></Link></main></Layout>}
function Report(){const {data,report}=useApp();const nav=useNavigate();const params=new URLSearchParams(location.search);const initial=data.find(t=>t.id===params.get('toilet'))||data[0];const [toilet,setToilet]=useState(initial.id);const [step,setStep]=useState(1);const [issue,setIssue]=useState('');const [rating,setRating]=useState(0);const [ticket,setTicket]=useState('');const submit=()=>{setTicket(report(toilet,issue));setStep(3)};const facility=data.find(t=>t.id===toilet);return <Modal>{step<3&&<button className="close" onClick={()=>nav(-1)}><X/></button>}{step===1&&<><p className="eyebrow">QUICK REPORT · 1 OF 2</p><h2>What needs attention?</h2><p className="muted">Your report is shared with the facility team.</p><label className="select-label">Facility<select value={toilet} onChange={e=>setToilet(e.target.value)}>{data.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label><div className="issue-grid">{[['Cleanliness',Sparkles],['Water',Droplets],['Blockage',AlertTriangle],['Electricity',CircleAlert],['Waste',Toilet],['Infrastructure',Wrench]].map(([x,Icon])=><button className={issue===x?'chosen':''} onClick={()=>setIssue(x)} key={x}><Icon/><span>{x}</span></button>)}</div><Button disabled={!issue} onClick={()=>setStep(2)}>Continue <ArrowRight size={18}/></Button></>}{step===2&&<><p className="eyebrow">QUICK REPORT · 2 OF 2</p><h2>Add a little detail</h2><p className="muted">A photo and rating help us assess this faster.</p><label className="photo"><input type="file" accept="image/png,image/jpeg"/><Camera/><strong>Add photo</strong><span>Optional · JPG or PNG</span></label><div className="rating"><strong>How would you rate this facility?</strong><div>{[1,2,3,4,5].map(i=><button className={i<=rating?'rated':''} onClick={()=>setRating(i)} key={i}><Star fill={i<=rating?'currentColor':'none'}/></button>)}</div></div><div className="report-actions"><Button variant="secondary" onClick={()=>setStep(1)}>Back</Button><Button onClick={submit}>Submit report <ArrowRight size={18}/></Button></div></>}{step===3&&<div className="success"><div className="success-icon"><CheckCircle2/></div><p className="eyebrow">REPORT RECEIVED</p><h2>Thank you for helping.</h2><p>Your ticket <strong>{ticket}</strong> has been sent to the facility team.</p><div className="resolution"><span>Expected resolution</span><strong>{facility.slaStatus==='Breached'?'Within 1 hour':'Within 3 hours'}</strong><small>Based on the current service SLA</small></div><Button onClick={()=>nav(`/toilet/${toilet}`)}>View facility status</Button><button className="text-btn" onClick={()=>nav('/')}>Back to nearby toilets</button></div>}</Modal>}
function AuthoritySidebar(){return <aside className="authority-sidebar"><Link className="brand" to="/authority"><span><Toilet size={20}/></span> ToiLens</Link><p>Authority command center</p><nav><Link to="/authority"><LayoutDashboard/>Overview</Link><Link to="/authority/map"><Map/>Health map</Link><Link to="/authority/complaints"><CircleAlert/>AI complaint inbox</Link><Link to="/authority/accessibility"><ShieldCheck/>Accessibility</Link></nav><div className="switch-view"><Link to="/"><Navigation/>Open citizen view</Link></div></aside>}
function AuthorityLayout({children}){return <><AuthoritySidebar/><div className="authority-page"><header className="authority-header"><div><span className="live-dot"/> ToiLens — AI-powered sanitation command center</div><div className="header-date"><Clock3/> Operations live · Saturday, 12 Sept</div></header>{location.pathname==='/authority'&&<EventModePanel/>}{children}</div><Toast/></>}
function SLATimeline({toilet}){const [seconds,setSeconds]=useState(toilet.slaStatus==='Breached'?0:toilet.slaStatus==='At risk'?40*60:2*60*60);useEffect(()=>{const timer=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(timer)},[]);const stages=['Received','Assigned','Cleaning','Resolved'];const active=toilet.slaStatus==='Breached'?3:toilet.assignedCrew?2:1;const time=seconds?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'Breached';return <section className="sla-timeline"><div className="section-head"><div><p className="eyebrow">SERVICE LEVEL TIMELINE</p><h3>Live work order</h3></div><StatusBadge score={toilet.slaStatus==='Breached'?30:toilet.slaStatus==='At risk'?54:80} label={toilet.slaStatus}/></div><div className="timeline-steps">{stages.map((stage,i)=><div className={i<=active?'done':''} key={stage}><i>{i<active?'✓':i+1}</i><span>{stage}</span><small>{i===0?'09:12':i===1?(toilet.assignedCrew||'Unassigned'):i===2?'In queue':'—'}</small></div>)}</div><div className="breach-note"><AlertTriangle/><span>{seconds?`Likely SLA breach in ${time}`:'SLA breached — dispatch supervisor now'}</span><strong>{toilet.assignedCrew||'Owner: Unassigned'}</strong></div><p className="recommendation"><Sparkles/> Recommendation: add 1 crew member to preserve the resolution window.</p></section>}
function EventModePanel(){const {eventApplied,applyEventRecommendations}=useApp();return <section className="event-mode-panel"><div className="event-map-mini"><span className="festival-dot d1"/><span className="festival-dot d2"/><span className="festival-dot d3"/><strong>Central zone</strong></div><div className="event-copy"><p className="eyebrow">EVENT MODE · ACTIVE</p><h2>Temple festival — predicted footfall +180%</h2><p>Predict which toilets will need attention before they become a problem.</p><div><IssueChip>Increase cleaning frequency</IssueChip><IssueChip>Deploy additional staff</IssueChip><IssueChip>Stock water & consumables</IssueChip></div></div><Button onClick={applyEventRecommendations} disabled={eventApplied}>{eventApplied?'Recommendations applied':'Apply recommendations'}</Button></section>}
function ComplaintInbox(){const {complaintData,data,updateComplaint,assignCrew}=useApp();const [tab,setTab]=useState('All');const [selected,setSelected]=useState(complaintData[0]);const filtered=complaintData.filter(c=>tab==='All'||(tab==='Recurring'?c.systemic:c.status===tab));const facility=id=>data.find(t=>t.id===id);return <AuthorityLayout><main className="authority-main"><div className="authority-title"><div><p className="eyebrow">AI COMPLAINT INBOX</p><h1>Signals requiring a human decision.</h1><p>Tags use deterministic recurrence, footfall, and complaint-frequency rules.</p></div><div className="recurring-insight"><Sparkles/> Recurring: No water — 6 reports today</div></div><div className="inbox-tabs">{['All','New','Assigned','Recurring','Resolved'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div><section className="inbox-layout"><div className="complaint-list">{filtered.map(c=>{const t=facility(c.toiletId);return <button className={`complaint-row ${selected?.id===c.id?'selected':''}`} onClick={()=>setSelected(c)} key={c.id}><div className="complaint-icon"><CircleAlert/></div><div><div className="complaint-row-top"><strong>{c.category}</strong><span>{c.time}</span></div><p>{c.text}</p><small><MapPin/> {t.name} · {t.location}</small></div><div className="complaint-tags"><span>{c.status}</span><b>{c.tag}</b></div></button>})}</div>{selected&&<aside className="reasoning-panel"><button className="panel-close" onClick={()=>setSelected(null)}><X/></button><p className="eyebrow">AI REASONING</p><h2>{selected.category} at {facility(selected.toiletId).name}</h2><p className="muted">{selected.time} · {selected.status}</p><div className="reasoning-score"><strong>{selected.systemic?'Systemic signal':'Operational signal'}</strong><span>{selected.systemic?'High confidence · 87%':'Moderate confidence · 68%'}</span></div><h3>Why this is flagged</h3><ul><li>{selected.systemic?'Three similar reports surfaced in the last two hours.':'A fresh report matches a facility service gap.'}</li><li>Footfall is {facility(selected.toiletId).footfall>500?'above':'within'} expected demand for this facility.</li><li>{facility(selected.toiletId).complaints} active complaints are linked to this toilet.</li></ul><SLATimeline toilet={facility(selected.toiletId)}/><div className="panel-actions"><Button onClick={()=>{updateComplaint(selected.id,'assign');assignCrew(selected.toiletId)}}><Users size={16}/> Assign to crew</Button><Button variant="secondary" onClick={()=>updateComplaint(selected.id,'escalate')}>Escalate</Button><Button variant="secondary" onClick={()=>updateComplaint(selected.id,'systemic')}>Mark systemic</Button></div></aside>}</section></main></AuthorityLayout>}
function Accessibility(){const {data,accessibility,updateAccess}=useApp();const [selected,setSelected]=useState(data[0].id);const toilet=data.find(t=>t.id===selected);const checks=[['ramp','Ramp'],['rails','Grab rails'],['door','Door width'],['lighting','Lighting'],['mh','Menstrual hygiene facilities']];const values=accessibility[selected];const score=Math.round(checks.filter(([k])=>values[k]).length/checks.length*100);return <AuthorityLayout><main className="authority-main"><div className="authority-title"><div><p className="eyebrow">ACCESSIBILITY READINESS</p><h1>Remove barriers, independently of THI.</h1><p>This assessment tracks facility access features only; it does not affect sanitation health.</p></div></div><section className="accessibility-layout"><div className="accessibility-list">{data.map(t=>{const v=accessibility[t.id],s=Math.round(Object.values(v).filter(Boolean).length/5*100);return <button onClick={()=>setSelected(t.id)} className={selected===t.id?'active':''} key={t.id}><div><strong>{t.name}</strong><span>{t.zone} · {t.location}</span></div><b>{s}%</b></button>})}</div><section className="assessment-panel"><div className="assessment-head"><div><p className="eyebrow">FACILITY ASSESSMENT</p><h2>{toilet.name}</h2></div><div className="access-score"><strong>{score}</strong><span>/100</span><small>Accessibility score</small></div></div><p className="separate-note"><ShieldCheck/> Separate from THI: this score measures access, safety, and dignity features.</p><div className="access-checks">{checks.map(([key,label])=><label key={key}><input type="checkbox" checked={values[key]} onChange={e=>updateAccess(selected,key,e.target.checked)}/><span>{label}</span><i>{values[key]?'Available':'Needs work'}</i></label>)}</div><div className="assessment-recommendation"><Sparkles/><div><strong>{score<60?'Prioritize access upgrades':'Maintain accessibility readiness'}</strong><span>{score<60?'Address missing features before the next inspection cycle.':'All core access elements are currently recorded.'}</span></div></div></section></section></main></AuthorityLayout>}
function QueueCard({toilet}){const {assignCrew,markCleaned}=useApp();return <article className="queue-card"><div className="queue-card-top"><div><span className="zone-tag">{toilet.zone}</span><h3>{toilet.name}</h3></div><StatusBadge score={toilet.thiScore}/></div><div className="queue-stats"><span><strong>{toilet.thiScore}</strong> THI</span><span><strong>{toilet.predictedThi}</strong> in 3h</span><span><strong>{toilet.complaints}</strong> reports</span></div><div className="queue-detail"><Clock3/> Cleaned {toilet.lastCleaned}</div><div className="queue-detail"><CircleAlert/> {toilet.topIssue}</div><p className="why"><strong>Why?</strong> Footfall 41% above normal + {toilet.complaints} complaints in 2h</p>{toilet.assignedCrew&&<p className="assignment"><Users/> {toilet.assignmentStatus}: {toilet.assignedCrew}</p>}<div className="queue-actions"><Button variant="secondary" onClick={()=>assignCrew(toilet.id)}>{toilet.assignedCrew?'Reassign crew':'Assign crew'}</Button><Button onClick={()=>markCleaned(toilet.id)}><CheckCircle2 size={15}/> Mark cleaned</Button></div><Link className="profile-link" to={`/authority/toilet/${toilet.id}`}>View profile <ChevronRight/></Link></article>}
function Authority(){const {data}=useApp();const attention=data.filter(t=>t.thiScore<75);const critical=data.filter(t=>t.thiScore<55);const complaints=data.reduce((sum,t)=>sum+t.complaints,0);const avg=Math.round(data.reduce((sum,t)=>sum+t.thiScore,0)/data.length);const lanes=[{name:'Clean immediately',key:'critical',items:data.filter(t=>t.priority==='Critical'),icon:'🔴'},{name:'Clean within 2 hours',key:'soon',items:data.filter(t=>['High','Medium'].includes(t.priority)),icon:'🟠'},{name:'No action required',key:'clear',items:data.filter(t=>t.priority==='Low'),icon:'🟢'}];return <AuthorityLayout><main className="authority-main"><div className="authority-title"><div><p className="eyebrow">CITY SANITATION OPERATIONS</p><h1>Good morning, control room.</h1><p>Prioritize today’s service interventions across {data.length} active facilities.</p></div><Link to="/authority/map"><Button variant="secondary"><Map size={17}/> Open health map</Button></Link></div><section className="authority-metrics"><MetricCard icon={Activity} label="Need attention" value={attention.length} detail="facilities"/><MetricCard icon={AlertTriangle} label="Critical toilets" value={critical.length} detail="clean now"/><MetricCard icon={CircleAlert} label="Open complaints" value={complaints} detail="across city"/><MetricCard icon={Gauge} label="Average THI" value={`${avg}/100`} detail="live score"/><MetricCard icon={Clock3} label="SLA risk" value={data.filter(t=>t.slaStatus!=='On track').length} detail="at risk or breached"/></section><section className="operational-overview"><div className="overview-copy"><p className="eyebrow">OPERATIONAL OVERVIEW</p><h2>{critical.length} facilities require immediate dispatch</h2><p>Rajiv Chowk Metro is the highest-risk facility, driven by a predicted THI of 28 and sustained blockage reports.</p><Link to="/authority/toilet/TL-105">Review highest priority <ArrowRight size={15}/></Link></div><div className="overview-breakdown"><div><span>On track</span><strong>{data.filter(t=>t.slaStatus==='On track').length}</strong></div><div><span>At risk</span><strong>{data.filter(t=>t.slaStatus==='At risk').length}</strong></div><div><span>Breached</span><strong>{data.filter(t=>t.slaStatus==='Breached').length}</strong></div></div></section><div className="queue-heading"><div><p className="eyebrow">PRIORITY QUEUE</p><h2>Deploy by urgency</h2></div><span>Updated just now</span></div><section className="priority-lanes">{lanes.map(lane=><div className={`lane ${lane.key}`} key={lane.key}><div className="lane-head"><span>{lane.icon}</span><div><h3>{lane.name}</h3><p>{lane.items.length} facilities</p></div></div><div className="lane-items">{lane.items.length?lane.items.map(t=><QueueCard key={t.id} toilet={t}/>):<p className="empty-lane">No facilities in this lane.</p>}</div></div>)}</section></main></AuthorityLayout>}
function ZoneMap(){const {data}=useApp();const [period,setPeriod]=useState('Today');const [eventMode,setEventMode]=useState(false);const [selected,setSelected]=useState('Central');const zones=['NDMC','Central','South'];const zoneData=zones.map(name=>{const facilities=data.filter(t=>t.zone===name);const average=Math.round(facilities.reduce((sum,t)=>sum+t.thiScore,0)/facilities.length);const top=facilities.sort((a,b)=>b.complaints-a.complaints)[0];return {name,average,topIssue:top.topIssue,recommendation:average<55?'Dispatch cleaning crew now':average<75?'Schedule service within 2 hours':'Maintain regular service'}});const current=zoneData.find(z=>z.name===selected);return <AuthorityLayout><main className="authority-main map-main"><div className="authority-title"><div><p className="eyebrow">CITY HEALTH MAP</p><h1>Sanitation heatmap</h1><p>Compare zone health and take action before service levels slip.</p></div><div className="map-controls"><div className="segmented">{['Today','Last 7 Days'].map(x=><button onClick={()=>setPeriod(x)} className={period===x?'selected':''} key={x}>{x}</button>)}</div><button className={`event-toggle ${eventMode?'enabled':''}`} onClick={()=>setEventMode(v=>!v)}><span/> Event mode {eventMode?'on':'off'}</button></div></div><section className="heatmap-layout"><div className="city-map"><div className="map-grid"/>{zoneData.map((zone,i)=><button onMouseEnter={()=>setSelected(zone.name)} onClick={()=>setSelected(zone.name)} className={`heat-zone zone-${i} ${status(zone.average)} ${selected===zone.name?'selected':''}`} key={zone.name}><strong>{zone.name}</strong><span>{zone.average} THI</span></button>)}<div className="map-legend"><span><i className="legend-good"/> Healthy</span><span><i className="legend-watch"/> Watch</span><span><i className="legend-alert"/> Immediate</span></div>{eventMode&&<div className="event-callout">Event demand modeled: +28% footfall</div>}</div><aside className="zone-panel"><p className="eyebrow">SELECTED ZONE</p><h2>{current.name}</h2><div className={`zone-score ${status(current.average)}`}><strong>{current.average}</strong><span>average THI</span></div><dl><div><dt>Top issue</dt><dd>{current.topIssue}</dd></div><div><dt>Recommended action</dt><dd>{current.recommendation}</dd></div><div><dt>Time window</dt><dd>{period}</dd></div></dl><Link to="/authority"><Button><ClipboardCheck size={17}/> Review priority queue</Button></Link></aside></section></main></AuthorityLayout>}
function CampusAuthorityMap(){return <AuthorityLayout><main className="authority-main map-main"><div className="authority-title"><div><p className="eyebrow">CAMPUS DATA</p><h1>VIT Vellore sanitation map</h1><p>Campus geotags and estimated toilet coverage. All scores update from shared ToiLens operations state.</p></div></div><CampusMap authority/></main></AuthorityLayout>}
function AuthorityProfile(){const {data,assignCrew,markCleaned,inspect,flagRepair}=useApp();const id=location.pathname.split('/').pop();const toilet=data.find(t=>t.id===id)||data[0];return <AuthorityLayout><main className="authority-main"><Link className="back" to="/authority">← Command center</Link><div className="profile-header"><div><p className="eyebrow">{toilet.zone} · {toilet.id}</p><h1>{toilet.name}</h1><p><MapPin size={15}/>{toilet.location}</p></div><StatusBadge score={toilet.thiScore}/></div><section className="authority-profile-grid"><div className="profile-health"><p className="eyebrow">CURRENT HEALTH</p><div className={`large-ring ${status(toilet.thiScore)}`} style={{'--score':`${toilet.thiScore*3.6}deg`}}><div><strong>{toilet.thiScore}</strong><span>/100</span></div></div><div className="score-compare"><span>Current <strong>{toilet.thiScore}</strong></span><ArrowRight size={16}/><span>Predicted in 3h <strong>{toilet.predictedThi}</strong></span></div></div><div className="profile-facts"><MetricCard icon={Clock3} label="Last cleaned" value={toilet.lastCleaned}/><MetricCard icon={Users} label="Citizen trust" value={`${toilet.citizenTrustScore}%`} detail="positive score"/><div className="accessibility-row"><strong>Accessibility</strong><AccessibilityBadge active={toilet.accessibility}/></div><SLAProgress toilet={toilet}/></div></section><section className="profile-content-grid"><div><div className="profile-section"><div className="section-head"><h2>Why this score?</h2><StatusBadge score={toilet.thiScore}/></div><p>Health is being pulled down by reported {toilet.topIssue.toLowerCase()}, sustained visitor demand, and time since the latest clean.</p><div className="drivers"><IssueChip>↑ 41% above usual footfall</IssueChip><IssueChip>{toilet.complaints} reports in 2h</IssueChip><IssueChip>Last service {toilet.lastCleaned}</IssueChip></div></div><div className="chart-grid"><FootfallChart toilet={toilet}/><THIChart toilet={toilet}/></div></div><aside className="action-panel"><p className="eyebrow">OPERATIONAL ACTIONS</p><h2>Take action</h2><p>{toilet.assignmentStatus||'No crew assigned yet.'}</p><Button onClick={()=>assignCrew(toilet.id)}><Users size={17}/>{toilet.assignedCrew?'Reassign cleaning':'Assign cleaning'}</Button><Button variant="secondary" onClick={()=>markCleaned(toilet.id)}><CheckCircle2 size={17}/> Mark cleaned</Button><Button variant="secondary" onClick={()=>inspect(toilet.id)}><Search size={17}/> Inspect</Button><Button variant="secondary" onClick={()=>flagRepair(toilet.id)}><Wrench size={17}/> Flag for repair</Button></aside></section></main></AuthorityLayout>}
function Layout({children}){return <><Sidebar/><div className="page">{children}</div><BottomNavigation/><Toast/></>}
function App(){return <AppProvider><BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/toilet/:id" element={<Detail/>}/><Route path="/report" element={<Report/>}/><Route path="/authority" element={<Authority/>}/><Route path="/authority/map" element={<CampusAuthorityMap/>}/><Route path="/authority/complaints" element={<ComplaintInbox/>}/><Route path="/authority/accessibility" element={<Accessibility/>}/><Route path="/authority/toilet/:id" element={<AuthorityProfile/>}/><Route path="*" element={<Home/>}/></Routes></BrowserRouter></AppProvider>}
createRoot(document.getElementById('root')).render(<App/>);
