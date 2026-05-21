import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const PLATFORMS = ["Amazon", "メルカリ", "eBay", "ヤフオク"];
const STATUSES = [
  { value: "pending", label: "仕入れ済み", color: "#BA7517", bg: "#FAEEDA" },
  { value: "listed", label: "出品中", color: "#185FA5", bg: "#E6F1FB" },
  { value: "sold", label: "売却済み", color: "#0F6E56", bg: "#E1F5EE" },
];

function calcProfit(item) {
  const feeAmt = Math.floor(item.sell * item.fee / 100);
  const totalCost = item.buy + item.ship_in + item.ship_out + feeAmt;
  const minSell = totalCost + 1;
  const profit = item.sell - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
  return { feeAmt, totalCost, profit, minSell, roi };
}

const EMPTY_FORM = { name: "", platform: "Amazon", buy: "", ship_in: "", sell: "", fee: "15", ship_out: "", status: "pending" };

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchItems();
  }, [session]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (!error) setItems(data);
    setLoading(false);
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else setAuthError("確認メールを送信しました。メールを確認してください。");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setItems([]);
  };

  const addItem = async () => {
    if (!form.name || !form.sell) { alert("商品名と出品価格は必須です"); return; }
    const newItem = {
      user_id: session.user.id,
      name: form.name,
      platform: form.platform,
      buy: parseFloat(form.buy) || 0,
      ship_in: parseFloat(form.ship_in) || 0,
      sell: parseFloat(form.sell) || 0,
      fee: parseFloat(form.fee) || 15,
      ship_out: parseFloat(form.ship_out) || 0,
      status: form.status,
    };
    const { error } = await supabase.from("items").insert([newItem]);
    if (!error) { fetchItems(); setForm(EMPTY_FORM); showMsg("追加しました"); }
  };

  const updateItem = async () => {
    if (!editItem.name || !editItem.sell) return;
    const { error } = await supabase.from("items").update({
      name: editItem.name,
      platform: editItem.platform,
      buy: parseFloat(editItem.buy) || 0,
      ship_in: parseFloat(editItem.ship_in) || 0,
      sell: parseFloat(editItem.sell) || 0,
      fee: parseFloat(editItem.fee) || 15,
      ship_out: parseFloat(editItem.ship_out) || 0,
      status: editItem.status,
    }).eq("id", editItem.id);
    if (!error) { fetchItems(); setEditItem(null); showMsg("更新しました"); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("items").update({ status }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteItem = async (id) => {
    if (!window.confirm("削除しますか？")) return;
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    showMsg("削除しました");
  };

  const filtered = filterStatus === "all" ? items : items.filter(i => i.status === filterStatus);
  const totalInvest = items.reduce((s, i) => s + i.buy + i.ship_in, 0);
  const totalProfit = items.reduce((s, i) => s + calcProfit(i).profit, 0);
  const soldProfit = items.filter(i => i.status === "sold").reduce((s, i) => s + calcProfit(i).profit, 0);

  const s = {
    wrap: { fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN',sans-serif", minHeight: "100vh", background: "#f5f5f3", color: "#1a1a1a" },
    container: { maxWidth: 900, margin: "0 auto", padding: "1rem" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 8 },
    title: { fontSize: 20, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 12, color: "#888", margin: 0 },
    badge: { fontSize: 12, color: "#0F6E56", background: "#E1F5EE", padding: "4px 12px", borderRadius: 99 },
    logoutBtn: { fontSize: 12, padding: "6px 14px", border: "0.5px solid #ddd", borderRadius: 8, cursor: "pointer", background: "#fff", fontFamily: "inherit" },
    summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: "1rem" },
    summaryCard: { background: "#fff", borderRadius: 12, padding: "12px 14px", border: "0.5px solid #e5e5e5" },
    card: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, padding: "1rem", marginBottom: "1rem" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 10 },
    label: { fontSize: 11, color: "#888", marginBottom: 3, display: "block" },
    input: { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" },
    select: { width: "100%", padding: "8px 10px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff" },
    btn: { width: "100%", padding: "10px 0", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    btnSm: { padding: "6px 12px", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
    filterRow: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" },
    listCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, overflow: "hidden" },
    itemRow: { padding: "12px 14px", borderBottom: "0.5px solid #f0f0f0" },
    metaRow: { display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#666", marginTop: 6 },
    warning: { marginTop: 6, fontSize: 11, color: "#E24B4A", background: "#FCEBEB", padding: "4px 10px", borderRadius: 6, display: "inline-block" },
    authWrap: { maxWidth: 380, margin: "80px auto", padding: "0 1rem" },
    authCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 16, padding: "2rem" },
  };

  if (!session) return (
    <div style={s.wrap}>
      <div style={s.authWrap}>
        <div style={s.authCard}>
          <h1 style={{ ...s.title, marginBottom: 4 }}>せどり収支管理</h1>
          <p style={{ ...s.subtitle, marginBottom: "1.5rem" }}>RetroArc</p>
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => setAuthMode(m)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "0.5px solid #ddd", cursor: "pointer", fontFamily: "inherit", fontSize: 13, background: authMode === m ? "#1a1a1a" : "#fff", color: authMode === m ? "#fff" : "#555", fontWeight: authMode === m ? 600 : 400 }}>
                {m === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={s.input} placeholder="email@example.com" required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={s.input} placeholder="••••••••" required />
            </div>
            {authError && <div style={{ fontSize: 12, color: "#E24B4A", marginBottom: 10 }}>{authError}</div>}
            <button type="submit" style={s.btn}>{authMode === "login" ? "ログイン" : "新規登録"}</button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>せどり収支管理</h1>
            <p style={s.subtitle}>RetroArc · {session.user.email}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {msg && <span style={s.badge}>{msg} ✓</span>}
            <button onClick={handleLogout} style={s.logoutBtn}>ログアウト</button>
          </div>
        </div>

        <div style={s.summaryGrid}>
          {[
            { label: "総仕入れ額", value: `¥${totalInvest.toLocaleString()}`, color: "#1a1a1a" },
            { label: "予想利益合計", value: `¥${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? "#0F6E56" : "#E24B4A" },
            { label: "確定利益", value: `¥${soldProfit.toLocaleString()}`, color: "#0F6E56" },
            { label: "商品数", value: `${items.length}点`, color: "#185FA5" },
          ].map(c => (
            <div key={c.label} style={s.summaryCard}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {editItem ? (
          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#555" }}>商品を編集</div>
            <div style={s.formGrid}>
              {[
                { key: "name", label: "商品名", type: "text" },
                { key: "buy", label: "仕入れ価格（¥）", type: "number" },
                { key: "ship_in", label: "仕入れ送料（¥）", type: "number" },
                { key: "sell", label: "出品価格（¥）", type: "number" },
                { key: "fee", label: "手数料（%）", type: "number" },
                { key: "ship_out", label: "発送送料（¥）", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label style={s.label}>{f.label}</label>
                  <input type={f.type} value={editItem[f.key]} onChange={e => setEditItem({ ...editItem, [f.key]: e.target.value })} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>プラットフォーム</label>
                <select value={editItem.platform} onChange={e => setEditItem({ ...editItem, platform: e.target.value })} style={s.select}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>ステータス</label>
                <select value={editItem.status} onChange={e => setEditItem({ ...editItem, status: e.target.value })} style={s.select}>
                  {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={updateItem} style={{ ...s.btnSm, background: "#1a1a1a", color: "#fff", flex: 1 }}>更新する</button>
              <button onClick={() => setEditItem(null)} style={{ ...s.btnSm, background: "#f0f0f0", color: "#555", flex: 1 }}>キャンセル</button>
            </div>
          </div>
        ) : (
          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#555" }}>商品を追加</div>
            <div style={s.formGrid}>
              {[
                { key: "name", label: "商品名", type: "text", placeholder: "ブロリーフィギュア" },
                { key: "buy", label: "仕入れ価格（¥）", type: "number", placeholder: "7800" },
                { key: "ship_in", label: "仕入れ送料（¥）", type: "number", placeholder: "0" },
                { key: "sell", label: "出品価格（¥）", type: "number", placeholder: "17363" },
                { key: "fee", label: "手数料（%）", type: "number", placeholder: "15" },
                { key: "ship_out", label: "発送送料（¥）", type: "number", placeholder: "3500" },
              ].map(f => (
                <div key={f.key}>
                  <label style={s.label}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>プラットフォーム</label>
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={s.select}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>ステータス</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={s.select}>
                  {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={addItem} style={s.btn}>追加する</button>
          </div>
        )}

        <div style={s.filterRow}>
          {[{ value: "all", label: "すべて" }, ...STATUSES].map(st => (
            <button key={st.value} onClick={() => setFilterStatus(st.value)}
              style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, border: "0.5px solid #ddd", cursor: "pointer", fontFamily: "inherit", background: filterStatus === st.value ? "#1a1a1a" : "#fff", color: filterStatus === st.value ? "#fff" : "#555", fontWeight: filterStatus === st.value ? 600 : 400 }}>
              {st.label}
            </button>
          ))}
        </div>

        <div style={s.listCard}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>商品がありません</div>
          ) : filtered.map(item => {
            const { profit, minSell, roi } = calcProfit(item);
            const st = STATUSES.find(s => s.value === item.status);
            const sellTooLow = item.sell < minSell;
            return (
              <div key={item.id} style={s.itemRow}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>{item.platform}</span>
                    </div>
                    <div style={s.metaRow}>
                      <span>仕入れ <b style={{ color: "#1a1a1a" }}>¥{Number(item.buy).toLocaleString()}</b></span>
                      <span>出品価格 <b style={{ color: sellTooLow ? "#E24B4A" : "#1a1a1a" }}>¥{Number(item.sell).toLocaleString()}</b></span>
                      <span>最低販売額 <b style={{ color: "#E24B4A" }}>¥{minSell.toLocaleString()}</b></span>
                      <span>利益 <b style={{ color: profit >= 0 ? "#0F6E56" : "#E24B4A" }}>¥{profit.toLocaleString()}</b></span>
                      <span>ROI <b style={{ color: roi >= 20 ? "#0F6E56" : roi >= 0 ? "#BA7517" : "#E24B4A" }}>{roi}%</b></span>
                    </div>
                    {sellTooLow && <div style={s.warning}>⚠ 出品価格が最低販売額を下回っています！¥{minSell.toLocaleString()}以上に設定してください</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                    <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}
                      style={{ padding: "4px 8px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 11, cursor: "pointer", outline: "none", fontFamily: "inherit", background: "#fff" }}>
                      {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditItem({ ...item })}
                        style={{ ...s.btnSm, background: "#E6F1FB", color: "#185FA5" }}>編集</button>
                      <button onClick={() => deleteItem(item.id)}
                        style={{ ...s.btnSm, background: "#fff7f7", color: "#E24B4A", border: "0.5px solid #ffd0d0" }}>削除</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
