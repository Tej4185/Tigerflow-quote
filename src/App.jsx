import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase.js'

// ============ COLORS & HELPERS ============
const O = "#E8740C", B = "#1A1A1A", OL = "#FFF3E0"
const fmt = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getLeadTime = (cat, inStock) => {
  if (cat === "CD Wet Ends") return "1 Week"
  if (cat === "Tigercubs") return "2–3 Weeks"
  if (cat === "Ocelot") return "1 Week"
  if (cat === "Motors" || cat === "Accessories") return "1 Week"
  if (cat === "T1HS" || cat === "TMHS") return inStock ? "1 Week" : "6–8 Weeks"
  return inStock ? "1–2 Weeks" : "6–8 Weeks"
}
const needsStock = cat => ["CD Pumps", "CD Pumps (1PH)", "T1HS", "TMHS", "TC Add-ons", "Duplex Add-ons"].includes(cat)

const iStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #444", background: "#111", color: "#fff", fontSize: 13, boxSizing: "border-box" }
const lStyle = { display: "block", fontSize: 10, fontWeight: 600, color: "#888", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }

// ============ MAIN APP ============
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState("quote")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setPage("quote")
  }

  if (loading) return <div style={{ background: B, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: O, fontSize: 18, fontWeight: 700 }}>Loading...</div></div>

  if (!session) return <LoginPage />

  if (profile && !profile.approved) return (
    <div style={{ background: B, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1e1e1e", borderRadius: 16, padding: 40, border: "1px solid #333", textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: O }}>TIGERFLOW</div>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginTop: 20 }}>Account Pending Approval</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 8 }}>Your registration is being reviewed by the admin. You'll be able to access the system once approved.</div>
        <button onClick={handleLogout} style={{ marginTop: 20, padding: "8px 24px", background: "#333", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Sign Out</button>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: B, minHeight: "100vh" }}>
      {/* NAV BAR */}
      <div style={{ background: "#111", borderBottom: `2px solid ${O}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: O }}>TIGERFLOW</span>
          <span style={{ color: "#555", fontSize: 12 }}>Quote Generator</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setPage("quote")} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: page === "quote" ? O : "#2a2a2a", color: page === "quote" ? "#fff" : "#aaa" }}>Quote Generator</button>
          {profile?.role === "admin" && <button onClick={() => setPage("admin")} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: page === "admin" ? O : "#2a2a2a", color: page === "admin" ? "#fff" : "#aaa" }}>Admin Panel</button>}
          <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>Hi, {profile?.full_name || session.user.email}</span>
          <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid #444", cursor: "pointer", background: "transparent", color: "#888" }}>Logout</button>
        </div>
      </div>

      {page === "quote" && <QuotePage />}
      {page === "admin" && profile?.role === "admin" && <AdminPage />}
    </div>
  )
}

// ============ LOGIN PAGE ============
function LoginPage() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    setError(""); setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setSubmitting(false)
  }

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("All fields required"); return }
    setError(""); setSubmitting(true)
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) { setError(error.message); setSubmitting(false); return }
    setSuccess("Registration submitted! Please wait for admin approval.")
    setMode("login"); setEmail(""); setPassword(""); setName("")
    setSubmitting(false)
  }

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: B, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380, background: "#1e1e1e", borderRadius: 16, padding: 40, border: "1px solid #333", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: O, letterSpacing: -1 }}>TIGERFLOW</div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>Pump Quote Generator</div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#111", borderRadius: 8, padding: 3 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccess("") }} style={{ flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: mode === m ? O : "transparent", color: mode === m ? "#fff" : "#888", textTransform: "capitalize" }}>{m === "login" ? "Sign In" : "Register"}</button>
          ))}
        </div>

        {error && <div style={{ background: "#3a1a1a", border: "1px solid #5a2a2a", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#ff6b6b" }}>{error}</div>}
        {success && <div style={{ background: "#1a3a1a", border: "1px solid #2a5a2a", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#4caf50" }}>{success}</div>}

        {mode === "register" && (
          <div style={{ marginBottom: 12 }}>
            <label style={lStyle}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={iStyle} placeholder="Your full name" />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={lStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={iStyle} placeholder="name@tigerflow.com" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lStyle}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())} style={iStyle} placeholder="Min 6 characters" />
        </div>
        <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={submitting} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: submitting ? "#666" : O, color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "wait" : "pointer" }}>
          {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Request Access"}
        </button>
      </div>
    </div>
  )
}

// ============ QUOTE PAGE ============
function QuotePage() {
  const [pumps, setPumps] = useState([])
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer] = useState({ name: "", company: "", email: "", phone: "", address: "", project: "" })
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState([])
  const [multiplier, setMultiplier] = useState(1.0)
  const [notes, setNotes] = useState("")
  const [view, setView] = useState("form")
  const [quoteNum] = useState(() => "TF-" + Date.now().toString(36).toUpperCase())

  useEffect(() => {
    supabase.from('pumps').select('*').order('sort_order', { ascending: true }).order('model', { ascending: true }).then(({ data }) => data && setPumps(data))
    supabase.from('customers').select('*').order('multiplier').order('name').then(({ data }) => data && setCustomers(data))
  }, [])

  const cats = useMemo(() => ["All", ...new Set(pumps.map(p => p.cat))], [pumps])
  const filtered = useMemo(() => {
    let l = pumps
    if (selectedCategory !== "All") l = l.filter(p => p.cat === selectedCategory)
    if (searchTerm) { const t = searchTerm.toLowerCase(); l = l.filter(p => p.model.toLowerCase().includes(t) || p.part_number.includes(t) || p.series.toLowerCase().includes(t) || p.hp.includes(t)) }
    return l
  }, [pumps, selectedCategory, searchTerm])

  const addToCart = p => { if (!cart.find(c => c.id === p.id)) setCart([...cart, { ...p, qty: 1, inStock: true }]) }
  const updateCart = (id, f, v) => setCart(cart.map(c => c.id === id ? { ...c, [f]: v } : c))
  const removeFromCart = id => setCart(cart.filter(c => c.id !== id))
  const getPrice = i => Number(i.list_price) * multiplier * i.qty
  const total = cart.reduce((s, c) => s + getPrice(c), 0)
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const handlePrint = () => {
    const el = document.getElementById("qp"); if (!el) return
    const w = window.open("", "_blank")
    w.document.write(`<html><head><title>Quote ${quoteNum}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:40px 50px;max-width:900px;margin:auto;font-size:13px}table{width:100%;border-collapse:collapse;font-size:11.5px}th{background:#FFF3E0;color:#1A1A1A;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:.8px;padding:9px 6px;text-align:left;border-bottom:2.5px solid #E8740C}td{padding:8px 6px;border-bottom:1px solid #f0e6d9}tr:nth-child(even){background:#FFFAF5}.right{text-align:right}</style></head><body>${el.innerHTML}</body></html>`)
    w.document.close(); w.print()
  }

  // PREVIEW
  if (view === "preview") {
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 12px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setView("form")} style={{ padding: "8px 16px", fontSize: 13, background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: 8, cursor: "pointer" }}>← Edit</button>
          <button onClick={handlePrint} style={{ padding: "8px 20px", fontSize: 13, background: O, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Print / Save PDF</button>
        </div>
        <div id="qp" style={{ background: "#fff", borderRadius: 12, padding: 32, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: `3px solid ${O}` }}>
            <div><div style={{ fontSize: 26, fontWeight: 800, color: O }}>TIGERFLOW</div><div style={{ color: "#666", fontSize: 12 }}>Pump Quotation</div></div>
            <div style={{ textAlign: "right", color: "#555", fontSize: 12, lineHeight: 1.8 }}><div><strong>Quote #:</strong> {quoteNum}</div><div><strong>Date:</strong> {today}</div><div><strong>Valid:</strong> 30 Days</div></div>
          </div>
          {(customer.name || customer.company) && <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", fontSize: 13 }}>{customer.name && <div><span style={{ color: "#888" }}>Contact:</span> <strong>{customer.name}</strong></div>}{customer.company && <div><span style={{ color: "#888" }}>Company:</span> <strong>{customer.company}</strong></div>}{customer.email && <div><span style={{ color: "#888" }}>Email:</span> <strong>{customer.email}</strong></div>}{customer.phone && <div><span style={{ color: "#888" }}>Phone:</span> <strong>{customer.phone}</strong></div>}{customer.project && <div><span style={{ color: "#888" }}>Project:</span> <strong>{customer.project}</strong></div>}</div>}
          <table><thead><tr>{["Category", "Model", "HP", "Voltage", "Connection", "Lead Time", "Qty", "List", "Customer Price", "Total"].map(h => <th key={h} style={{ background: OL, borderBottom: `2.5px solid ${O}`, textAlign: ["List", "Customer Price", "Total", "Qty"].includes(h) ? "right" : "left" }}>{h}</th>)}</tr></thead><tbody>
            {cart.map((it, i) => { const lt = getLeadTime(it.cat, it.inStock); const custPrice = Number(it.list_price) * multiplier; return (
              <tr key={it.id} style={{ background: i % 2 === 0 ? "#fff" : "#FFFAF5" }}><td>{it.cat}</td><td style={{ fontWeight: 600 }}>{it.model}</td><td>{it.hp}</td><td>{it.voltage}</td><td>{it.connection}</td><td><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: lt.includes("1") ? "#d4edda" : "#fff3cd", color: lt.includes("1") ? "#155724" : "#856404" }}>{lt}</span></td><td style={{ textAlign: "right" }}>{it.qty}</td><td style={{ textAlign: "right", color: "#888" }}>{fmt(it.list_price)}</td><td style={{ textAlign: "right" }}>{fmt(custPrice)}</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(getPrice(it))}</td></tr>
            ) })}
          </tbody></table>
          <div style={{ textAlign: "right", paddingTop: 14, borderTop: `3px solid ${O}`, marginTop: 8 }}><span style={{ color: "#555", marginRight: 12 }}>Total:</span><span style={{ fontSize: 24, fontWeight: 800 }}>{fmt(total)}</span></div>
          {notes && <div style={{ background: OL, borderRadius: 6, padding: 12, marginTop: 16, fontSize: 12 }}><strong>Notes:</strong> {notes}</div>}
          <div style={{ marginTop: 30, textAlign: "center", color: "#999", fontSize: 10, borderTop: "1px solid #e0d5c7", paddingTop: 14 }}>Quote valid 30 days · TigerFlow Systems, Inc. · Dallas, TX · www.tigerflow.com</div>
        </div>
      </div>
    )
  }

  // FORM
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 12px" }}>
      {/* Customer */}
      <div style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h2 style={{ color: O, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Customer Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[["name", "Contact"], ["company", "Company"], ["email", "Email"], ["phone", "Phone"], ["project", "Project"], ["address", "Address"]].map(([k, l]) => (
            <div key={k}><label style={lStyle}>{l}</label><input value={customer[k]} onChange={e => setCustomer({ ...customer, [k]: e.target.value })} style={iStyle} /></div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ color: O, fontSize: 14, fontWeight: 700 }}>Select Equipment</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); const f = customers.find(x => x.name === e.target.value); if (f) setMultiplier(f.multiplier) }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #444", background: "#111", color: "#fff", fontSize: 12, maxWidth: 200 }}>
              <option value="">Customer tier...</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name} ({c.multiplier})</option>)}
            </select>
            <span style={{ color: "#888", fontSize: 12 }}>×</span>
            <input type="number" step="0.01" min="0.1" value={multiplier} onChange={e => setMultiplier(Math.max(0.1, parseFloat(e.target.value) || 1))} style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#111", color: "#fff", fontSize: 12, textAlign: "center" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {cats.map(c => <button key={c} onClick={() => setSelectedCategory(c)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${selectedCategory === c ? O : "#444"}`, background: selectedCategory === c ? O : "#111", color: selectedCategory === c ? "#fff" : "#aaa", cursor: "pointer" }}>{c}</button>)}
        </div>
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search model, part #, series..." style={{ ...iStyle, marginBottom: 8 }} />
        <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{filtered.length} items found</div>
        <div style={{ maxHeight: 340, overflowY: "auto", border: "1px solid #3a3a3a", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr>{["Cat", "Model", "HP", "Voltage", "Connection", "PN", "List", ""].map((h, i) => <th key={i} style={{ position: "sticky", top: 0, background: "#111", color: O, fontWeight: 700, fontSize: 10, padding: "8px 5px", textAlign: h === "List" ? "right" : "left", borderBottom: `2px solid ${O}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((p, i) => { const ic = cart.find(c => c.id === p.id); return (
                <tr key={p.id} style={{ background: ic ? "#3a2a1a" : i % 2 === 0 ? "#2a2a2a" : "#222" }}>
                  <td style={{ padding: "5px", fontSize: 9, fontWeight: 700, color: O }}>{p.cat}</td>
                  <td style={{ padding: "5px", fontWeight: 600, color: "#fff" }}>{p.model}</td>
                  <td style={{ padding: "5px", color: "#ccc" }}>{p.hp}</td>
                  <td style={{ padding: "5px", color: "#ccc", fontSize: 11 }}>{p.voltage}</td>
                  <td style={{ padding: "5px", color: "#aaa", fontSize: 10 }}>{p.connection}</td>
                  <td style={{ padding: "5px", color: "#666", fontSize: 10 }}>{p.part_number}</td>
                  <td style={{ padding: "5px", textAlign: "right", fontWeight: 600, color: "#fff" }}>{fmt(p.list_price)}</td>
                  <td style={{ padding: "5px", textAlign: "center" }}>{ic ? <span style={{ color: O, fontWeight: 700, fontSize: 10 }}>✓</span> : <button onClick={() => addToCart(p)} style={{ background: O, color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>+</button>}</td>
                </tr>
              ) })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h2 style={{ color: O, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quote Items ({cart.length})</h2>
          {cart.map(item => { const lt = getLeadTime(item.cat, item.inStock); return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #3a3a3a", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}><div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}><span style={{ fontSize: 9, color: O, background: "#3a2a1a", borderRadius: 4, padding: "1px 5px", marginRight: 6 }}>{item.cat}</span>{item.model}</div><div style={{ color: "#888", fontSize: 11 }}>{item.hp !== "—" ? item.hp + " HP · " : ""}{item.voltage !== "—" ? item.voltage : ""} · List: {fmt(item.list_price)}</div></div>
              <div><label style={{ display: "block", fontSize: 10, color: "#666" }}>Qty</label><input type="number" min="1" value={item.qty} onChange={e => updateCart(item.id, "qty", Math.max(1, +e.target.value || 1))} style={{ width: 50, padding: "4px", borderRadius: 4, border: "1px solid #444", background: "#111", color: "#fff", textAlign: "center", fontSize: 12 }} /></div>
              {needsStock(item.cat) && <div><label style={{ display: "block", fontSize: 10, color: "#666" }}>Stock?</label><select value={item.inStock ? "y" : "n"} onChange={e => updateCart(item.id, "inStock", e.target.value === "y")} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #444", background: "#111", color: "#fff", fontSize: 12 }}><option value="y">Yes</option><option value="n">No</option></select></div>}
              <div style={{ textAlign: "right", minWidth: 70 }}><div style={{ fontSize: 10, color: "#666" }}>Lead</div><span style={{ fontSize: 11, fontWeight: 700, color: lt.includes("1") || lt === "In Stock" ? "#4caf50" : O }}>{lt}</span></div>
              <div style={{ textAlign: "right", minWidth: 80 }}><div style={{ fontSize: 10, color: "#666" }}>Total</div><div style={{ fontWeight: 700, color: "#fff" }}>{fmt(getPrice(item))}</div></div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
          ) })}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
            <div><label style={lStyle}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...iStyle, width: 300 }} placeholder="Payment terms..." /></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#888" }}>Quote Total</div><div style={{ fontSize: 28, fontWeight: 800, color: O }}>{fmt(total)}</div></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setView("preview")} style={{ padding: "10px 24px", background: O, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Preview & Print PDF →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ ADMIN PAGE ============
function AdminPage() {
  const [tab, setTab] = useState("pumps")
  const [pumps, setPumps] = useState([])
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [search, setSearch] = useState("")
  const [custEdit, setCustEdit] = useState(null)
  const [custForm, setCustForm] = useState({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: p } = await supabase.from('pumps').select('*').order('sort_order', { ascending: true }).order('model', { ascending: true })
    const { data: c } = await supabase.from('customers').select('*').order('name')
    const { data: u } = await supabase.from('profiles').select('*').order('created_at')
    if (p) setPumps(p); if (c) setCustomers(c); if (u) setUsers(u)
  }

  // Pump CRUD
  const startAddPump = () => { setEditId("new"); setForm({ cat: "CD Pumps", series: "", model: "", hp: "", voltage: "", part_number: "", connection: "", list_price: "", net_price: "" }) }
  const startEditPump = p => { setEditId(p.id); setForm({ ...p }) }
  const savePump = async () => {
    if (!form.model || !form.part_number || !form.list_price) { alert("Model, Part # and LIST price required"); return }
    const data = { cat: form.cat, series: form.series, model: form.model, hp: form.hp, voltage: form.voltage, part_number: form.part_number, connection: form.connection, list_price: parseFloat(form.list_price), net_price: parseFloat(form.net_price || 0) }
    if (editId === "new") { await supabase.from('pumps').insert(data) }
    else { await supabase.from('pumps').update(data).eq('id', editId) }
    setEditId(null); loadData()
  }
  const deletePump = async id => { if (confirm("Delete this pump?")) { await supabase.from('pumps').delete().eq('id', id); loadData() } }

  // Customer CRUD
  const startAddCust = () => { setCustEdit("new"); setCustForm({ name: "", multiplier: 0.34 }) }
  const saveCust = async () => {
    if (!custForm.name) { alert("Name required"); return }
    const data = { name: custForm.name, multiplier: parseFloat(custForm.multiplier) }
    if (custEdit === "new") { await supabase.from('customers').insert(data) }
    else { await supabase.from('customers').update(data).eq('id', custEdit) }
    setCustEdit(null); loadData()
  }

  // User management
  const approveUser = async id => { await supabase.from('profiles').update({ approved: true }).eq('id', id); loadData() }
  const removeUser = async id => { if (confirm("Remove this user?")) { await supabase.from('profiles').delete().eq('id', id); loadData() } }

  const filteredPumps = pumps.filter(p => { if (!search) return true; const t = search.toLowerCase(); return p.model.toLowerCase().includes(t) || p.part_number.includes(t) || p.cat.toLowerCase().includes(t) })

  const cellStyle = { padding: "6px 8px", borderBottom: "1px solid #3a3a3a", color: "#ccc", fontSize: 12 }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 12px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["pumps", "customers", "users"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${tab === t ? O : "#444"}`, background: tab === t ? O : "#2a2a2a", color: tab === t ? "#fff" : "#aaa", cursor: "pointer" }}>{t === "pumps" ? "Pump Database" : t === "customers" ? "Customer Multipliers" : "User Management"}</button>
        ))}
      </div>

      {/* PUMPS */}
      {tab === "pumps" && (
        <div style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ color: O, fontSize: 14, fontWeight: 700 }}>Pump Database ({pumps.length} items)</h2>
            <button onClick={startAddPump} style={{ padding: "8px 16px", background: O, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add New Pump</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pumps..." style={{ ...iStyle, marginBottom: 12 }} />
          {editId && (
            <div style={{ background: "#1a1a1a", border: `1px solid ${O}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ color: O, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{editId === "new" ? "Add New Pump" : "Edit Pump"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                {[["cat", "Category"], ["series", "Series"], ["model", "Model"], ["hp", "HP"], ["voltage", "Voltage"], ["part_number", "Part Number"], ["connection", "Connection"], ["list_price", "LIST Price ($)"], ["net_price", "NET Price ($)"]].map(([k, l]) => (
                  <div key={k}><label style={{ display: "block", fontSize: 10, color: "#888", marginBottom: 2 }}>{l}</label>
                    {k === "cat" ? <select value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} style={iStyle}>{["CD Pumps", "CD Pumps (1PH)", "CD Wet Ends", "Tigercubs", "TC Add-ons", "Ocelot", "Duplex Add-ons", "T1HS", "TMHS", "Motors", "Accessories"].map(c => <option key={c}>{c}</option>)}</select>
                      : <input value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} style={iStyle} />}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={savePump} style={{ padding: "8px 20px", background: O, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditId(null)} style={{ padding: "8px 20px", background: "#444", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Cat", "Series", "Model", "HP", "Voltage", "Part #", "Connection", "LIST", "NET", "Actions"].map(h => <th key={h} style={{ position: "sticky", top: 0, background: "#1a1a1a", color: O, fontSize: 10, fontWeight: 700, padding: "8px 6px", textAlign: (h === "NET" || h === "LIST") ? "right" : "left", borderBottom: `2px solid ${O}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredPumps.map(p => (
                  <tr key={p.id}>
                    <td style={cellStyle}><span style={{ fontSize: 9, color: O, background: "#3a2a1a", padding: "1px 4px", borderRadius: 3 }}>{p.cat}</span></td>
                    <td style={cellStyle}>{p.series}</td>
                    <td style={{ ...cellStyle, fontWeight: 600, color: "#fff" }}>{p.model}</td>
                    <td style={cellStyle}>{p.hp}</td>
                    <td style={cellStyle}>{p.voltage}</td>
                    <td style={{ ...cellStyle, color: "#666" }}>{p.part_number}</td>
                    <td style={cellStyle}>{p.connection}</td>
                    <td style={{ ...cellStyle, textAlign: "right", fontWeight: 600, color: "#fff" }}>{fmt(p.list_price)}</td>
                    <td style={{ ...cellStyle, textAlign: "right", color: "#aaa" }}>{fmt(p.net_price)}</td>
                    <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                      <button onClick={() => startEditPump(p)} style={{ background: "none", border: "none", color: O, cursor: "pointer", fontSize: 11, fontWeight: 600, marginRight: 8 }}>Edit</button>
                      <button onClick={() => deletePump(p.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMERS */}
      {tab === "customers" && (
        <div style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ color: O, fontSize: 14, fontWeight: 700 }}>Customer Multipliers ({customers.length})</h2>
            <button onClick={startAddCust} style={{ padding: "8px 16px", background: O, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Customer</button>
          </div>
          {custEdit && (
            <div style={{ background: "#1a1a1a", border: `1px solid ${O}`, borderRadius: 8, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "end" }}>
              <div style={{ flex: 1 }}><label style={{ display: "block", fontSize: 10, color: "#888", marginBottom: 2 }}>Customer Name</label><input value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} style={iStyle} /></div>
              <div style={{ width: 100 }}><label style={{ display: "block", fontSize: 10, color: "#888", marginBottom: 2 }}>Multiplier</label><input type="number" step="0.01" value={custForm.multiplier} onChange={e => setCustForm({ ...custForm, multiplier: e.target.value })} style={iStyle} /></div>
              <button onClick={saveCust} style={{ padding: "8px 16px", background: O, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
              <button onClick={() => setCustEdit(null)} style={{ padding: "8px 16px", background: "#444", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          )}
          {customers.map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 8px", borderBottom: "1px solid #3a3a3a" }}>
              <span style={{ color: "#fff", fontSize: 13 }}>{c.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: O, fontWeight: 700, fontSize: 14 }}>{c.multiplier}</span>
                <button onClick={() => { setCustEdit(c.id); setCustForm({ ...c }) }} style={{ background: "none", border: "none", color: O, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Edit</button>
                <button onClick={async () => { await supabase.from('customers').delete().eq('id', c.id); loadData() }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: O, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>User Management ({users.length})</h2>
          {users.map(u => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid #3a3a3a" }}>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{u.full_name || "—"} <span style={{ fontSize: 10, color: u.role === "admin" ? O : "#888", background: u.role === "admin" ? "#3a2a1a" : "#2a2a2a", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>{u.role}</span></div>
                <div style={{ color: "#666", fontSize: 11 }}>{u.email}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: u.approved ? "#4caf50" : "#ff6b6b" }}>{u.approved ? "Approved" : "Pending"}</span>
                {!u.approved && <button onClick={() => approveUser(u.id)} style={{ padding: "4px 12px", background: "#1a3a1a", color: "#4caf50", border: "1px solid #2a5a2a", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Approve</button>}
                {u.role !== "admin" && <button onClick={() => removeUser(u.id)} style={{ padding: "4px 12px", background: "#3a1a1a", color: "#ff6b6b", border: "1px solid #5a2a2a", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}