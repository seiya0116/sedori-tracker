import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const PLATFORMS = ["Amazon", "メルカリ", "eBay", "ヤフオク"];
const STATUSES = [
  { value: "pending", label: "仕入れ済み", color: "#BA7517", bg: "#FAEEDA" },
  { value: "listed", label: "出品中", color: "#185FA5", bg: "#E6F1FB" },
  { value: "sold", label: "売却済み", color: "#0F6E56", bg: "#E1F5EE" },
];
const PAGE_SIZE = 10;

const S = {
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
  filterRow: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" },
  listCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, overflow: "hidden" },
  itemRow: { padding: "12px 14px", borderBottom: "0.5px solid #f0f0f0" },
  childRow: { padding: "10px 14px 10px 32px", borderBottom: "0.5px solid #f0f0f0", background: "#fafaf9", borderLeft: "3px solid #e5e5e5" },
  editInlineCard: { margin: "0", padding: "12px 14px", background: "#f0f6ff", borderBottom: "0.5px solid #d0e4ff", borderLeft: "3px solid #378ADD" },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#666", marginTop: 6 },
  warning: { marginTop: 6, fontSize: 11, color: "#E24B4A", background: "#FCEBEB", padding: "4px 10px", borderRadius: 6, display: "inline-block" },
  authWrap: { maxWidth: 380, margin: "80px auto", padding: "0 1rem" },
  authCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 16, padding: "2rem" },
  link: { fontSize: 12, color: "#185FA5", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", fontFamily: "inherit", padding: 0 },
};

function calcProfit(item) {
  const feeAmt = Math.round((item.sell || 0) * (item.fee || 0) / 100);
  const totalCost = (item.buy || 0) + (item.ship_in || 0) + (item.ship_out || 0) + feeAmt;
  const minSell = totalCost + 1;
  const profit = (item.sell || 0) - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
  return { feeAmt, totalCost, profit, minSell, roi };
}

const EMPTY_FORM = { name: "", platform: "メルカリ", buy: "", ship_in: "", sell: "", fee: "10", ship_out: "", status: "pending", parent_id: "" };

function ItemForm({ data, setData, onSubmit, onCancel, isEdit, parentOptions, compact }) {
  return (
    <div style={compact ? S.editInlineCard : S.card}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: isEdit ? "#185FA5" : "#555" }}>
        {isEdit ? "✎ 編集中" : "商品を追加"}
      </div>
      <div style={S.formGrid}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={S.label}>商品名</label>
          <input type="text" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} style={S.input} />
        </div>
        {[
          { key: "buy", label: "仕入れ価格（¥）" },
          { key: "ship_in", label: "仕入れ送料（¥）" },
          { key: "sell", label: "出品価格（¥）" },
          { key: "fee", label: "手数料（%）" },
          { key: "ship_out", label: "発送送料（¥）" },
        ].map(f => (
          <div key={f.key}>
            <label style={S.label}>{f.label}</label>
            <input type="number" value={data[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })} style={S.input} />
          </div>
        ))}
        <div>
          <label style={S.label}>プラットフォーム</label>
          <select value={data.platform} onChange={e => setData({ ...data, platform: e.target.value })} style={S.select}>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>ステータス</label>
          <select value={data.status} onChange={e => setData({ ...data, status: e.target.value })} style={S.select}>
            {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={S.label}>まとめ売りセットに追加（任意）</label>
          <select value={data.parent_id || ""} onChange={e => setData({ ...data, parent_id: e.target.value })} style={S.select}>
            <option value="">なし（単品）</option>
            {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSubmit} style={{ ...S.btnSm, background: "#1a1a1a", color: "#fff", flex: 1, padding: "10px 0" }}>
          {isEdit ? "更新する" : "追加する"}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ ...S.btnSm, background: "#f0f0f0", color: "#555", flex: 1, padding: "10px 0" }}>
            キャンセル
          </button>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item, children, isChild, expandedIds, toggleExpand, updateStatus, setInlineEditId, inlineEditId, deleteItem, editFormElement }) {
  const hasChildren = children && children.length > 0;
  const isExpanded = expandedIds[item.id];
  const st = STATUSES.find(s => s.value === item.status) || STATUSES[0];
  const { profit, minSell, roi } = calcProfit(item);
  const sellTooLow = item.sell < minSell;

  return (
    <>
      <div style={isChild ? S.childRow : S.itemRow}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              {hasChildren && (
                <button onClick={() => toggleExpand(item.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", color: "#185FA5", fontFamily: "inherit" }}>
                  {isExpanded ? "▼" : "▶"}
                </button>
              )}
              <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>{item.platform}</span>
              {hasChildren && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#f0f0f0", color: "#666" }}>セット {children.length}点</span>}
            </div>
            <div style={S.metaRow}>
              <span>仕入れ <b style={{ color: "#1a1a1a" }}>¥{Number(item.buy || 0).toLocaleString()}</b></span>
              <span>出品価格 <b style={{ color: sellTooLow ? "#E24B4A" : "#1a1a1a" }}>¥{Number(item.sell || 0).toLocaleString()}</b></span>
              <span>最低販売額 <b style={{ color: "#E24B4A" }}>¥{minSell.toLocaleString()}</b></span>
              <span>利益 <b style={{ color: profit >= 0 ? "#0F6E56" : "#E24B4A" }}>¥{profit.toLocaleString()}</b></span>
              <span>ROI <b style={{ color: roi >= 20 ? "#0F6E56" : roi >= 0 ? "#BA7517" : "#E24B4A" }}>{roi}%</b></span>
            </div>
            {sellTooLow && <div style={S.warning}>⚠ 出品価格が最低販売額を下回っています！¥{minSell.toLocaleString()}以上に設定してください</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
            <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}
              style={{ padding: "4px 8px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 11, cursor: "pointer", outline: "none", fontFamily: "inherit", background: "#fff" }}>
              {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setInlineEditId(inlineEditId === item.id ? null : item.id)}
                style={{ ...S.btnSm, background: inlineEditId === item.id ? "#1a1a1a" : "#E6F1FB", color: inlineEditId === item.id ? "#fff" : "#185FA5" }}>
                {inlineEditId === item.id ? "閉じる" : "編集"}
              </button>
              <button onClick={() => deleteItem(item.id)} style={{ ...S.btnSm, background: "#fff7f7", color: "#E24B4A", border: "0.5px solid #ffd0d0" }}>削除</button>
            </div>
          </div>
        </div>
      </div>
      {hasChildren && isExpanded && children.map(child => (
        <div key={child.id}>
          <ItemRow item={child} children={[]} isChild={true}
            expandedIds={expandedIds} toggleExpand={toggleExpand} updateStatus={updateStatus}
            setInlineEditId={setInlineEditId} inlineEditId={inlineEditId} deleteItem={deleteItem}
            editFormElement={editFormElement} />
          {inlineEditId === child.id && editFormElement}
        </div>
      ))}
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState(null);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session && !isRecovery) fetchItems(); }, [session, isRecovery]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 2000); };

  const handleAuth = async (e) => {
    e.preventDefault(); setAuthError("");
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else setAuthError("確認メールを送信しました。");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault(); setResetMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin });
    if (error) setResetMsg(error.message);
    else setResetMsg("パスワードリセットメールを送信しました。");
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setResetMsg(error.message);
    else { setIsRecovery(false); setResetMsg(""); setNewPassword(""); showMsg("パスワードを変更しました"); fetchItems(); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setItems([]); };

  const addItem = async () => {
    if (!form.name || !form.sell) { alert("商品名と出品価格は必須です"); return; }
    const { error } = await supabase.from("items").insert([{
      user_id: session.user.id, name: form.name, platform: form.platform,
      buy: parseFloat(form.buy) || 0, ship_in: parseFloat(form.ship_in) || 0,
      sell: parseFloat(form.sell) || 0, fee: parseFloat(form.fee) || 10,
      ship_out: parseFloat(form.ship_out) || 0, status: form.status,
      parent_id: form.parent_id || null,
    }]);
    if (!error) { fetchItems(); setForm(EMPTY_FORM); showMsg("追加しました"); }
  };

  const updateItem = async () => {
    if (!editItem || !editItem.name || !editItem.sell) return;
    const { error } = await supabase.from("items").update({
      name: editItem.name, platform: editItem.platform,
      buy: parseFloat(editItem.buy) || 0, ship_in: parseFloat(editItem.ship_in) || 0,
      sell: parseFloat(editItem.sell) || 0, fee: parseFloat(editItem.fee) || 10,
      ship_out: parseFloat(editItem.ship_out) || 0, status: editItem.status,
      parent_id: editItem.parent_id || null,
    }).eq("id", editItem.id);
    if (!error) { fetchItems(); setEditItem(null); setInlineEditId(null); showMsg("更新しました"); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("items").update({ status }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteItem = async (id) => {
    if (!window.confirm("削除しますか？")) return;
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (inlineEditId === id) setInlineEditId(null);
    showMsg("削除しました");
  };

  const toggleExpand = (id) => setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

  const handleInlineEdit = (id) => {
    if (inlineEditId === id) { setInlineEditId(null); setEditItem(null); return; }
    const item = items.find(i => i.id === id);
    if (item) { setEditItem({ ...item }); setInlineEditId(id); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const parentItems = items.filter(i => !i.parent_id);
  const childrenOf = (id) => items.filter(i => i.parent_id === id);

  const filteredParents = parentItems
    .filter(i => filterStatus === "all" || i.status === filterStatus)
    .filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.platform.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "profit") { av = calcProfit(a).profit; bv = calcProfit(b).profit; }
      if (sortKey === "roi") { av = calcProfit(a).roi; bv = calcProfit(b).roi; }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });

  const totalPages = Math.ceil(filteredParents.length / PAGE_SIZE);
  const pagedItems = filteredParents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalInvest = parentItems.reduce((s, i) => s + (i.buy || 0) + (i.ship_in || 0), 0);
  const totalProfit = parentItems.reduce((s, i) => s + calcProfit(i).profit, 0);
  const soldProfit = parentItems.filter(i => i.status === "sold").reduce((s, i) => s + calcProfit(i).profit, 0);
  const soldRevenue = parentItems.filter(i => i.status === "sold").reduce((s, i) => s + (i.sell || 0), 0);
  const parentOptions = parentItems.filter(p => !editItem || p.id !== editItem.id);

  const SortBtn = ({ k, label }) => (
    <button onClick={() => toggleSort(k)}
      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "0.5px solid #ddd", cursor: "pointer", fontFamily: "inherit", background: sortKey === k ? "#1a1a1a" : "#fff", color: sortKey === k ? "#fff" : "#555" }}>
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </button>
  );

  if (isRecovery) return (
    <div style={S.wrap}><div style={S.authWrap}><div style={S.authCard}>
      <h1 style={{ ...S.title, marginBottom: 4 }}>新しいパスワード設定</h1>
      <form onSubmit={handleNewPassword}>
        <div style={{ marginBottom: 16 }}><label style={S.label}>新しいパスワード（6文字以上）</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={S.input} placeholder="••••••••" required minLength={6} /></div>
        {resetMsg && <div style={{ fontSize: 12, color: "#E24B4A", marginBottom: 10 }}>{resetMsg}</div>}
        <button type="submit" style={S.btn}>パスワードを変更する</button>
      </form>
    </div></div></div>
  );

  if (resetMode) return (
    <div style={S.wrap}><div style={S.authWrap}><div style={S.authCard}>
      <h1 style={{ ...S.title, marginBottom: 4 }}>パスワードリセット</h1>
      <form onSubmit={handlePasswordReset}>
        <div style={{ marginBottom: 16 }}><label style={S.label}>メールアドレス</label>
          <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} style={S.input} placeholder="email@example.com" required /></div>
        {resetMsg && <div style={{ fontSize: 12, color: resetMsg.includes("送信") ? "#0F6E56" : "#E24B4A", marginBottom: 10 }}>{resetMsg}</div>}
        <button type="submit" style={S.btn}>リセットメールを送信</button>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button style={S.link} onClick={() => { setResetMode(false); setResetMsg(""); }}>ログインに戻る</button>
        </div>
      </form>
    </div></div></div>
  );

  if (!session) return (
    <div style={S.wrap}><div style={S.authWrap}><div style={S.authCard}>
      <h1 style={{ ...S.title, marginBottom: 4 }}>せどり収支管理</h1>
      <p style={{ ...S.subtitle, marginBottom: "1.5rem" }}>RetroArc</p>
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        {["login", "signup"].map(m => (
          <button key={m} onClick={() => setAuthMode(m)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "0.5px solid #ddd", cursor: "pointer", fontFamily: "inherit", fontSize: 13, background: authMode === m ? "#1a1a1a" : "#fff", color: authMode === m ? "#fff" : "#555", fontWeight: authMode === m ? 600 : 400 }}>
            {m === "login" ? "ログイン" : "新規登録"}
          </button>
        ))}
      </div>
      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: 10 }}><label style={S.label}>メールアドレス</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} placeholder="email@example.com" required /></div>
        <div style={{ marginBottom: 8 }}><label style={S.label}>パスワード</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={S.input} placeholder="••••••••" required /></div>
        {authMode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 12 }}>
            <button style={S.link} onClick={() => setResetMode(true)} type="button">パスワードを忘れた方はこちら</button>
          </div>
        )}
        {authError && <div style={{ fontSize: 12, color: "#E24B4A", marginBottom: 10 }}>{authError}</div>}
        <button type="submit" style={S.btn}>{authMode === "login" ? "ログイン" : "新規登録"}</button>
      </form>
    </div></div></div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.container}>
        <div style={S.header}>
          <div><h1 style={S.title}>せどり収支管理</h1><p style={S.subtitle}>RetroArc · {session.user.email}</p></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {msg && <span style={S.badge}>{msg} ✓</span>}
            <button onClick={handleLogout} style={S.logoutBtn}>ログアウト</button>
          </div>
        </div>

        <div style={S.summaryGrid}>
          {[
            { label: "総仕入れ額", value: `¥${totalInvest.toLocaleString()}`, color: "#1a1a1a" },
            { label: "予想利益合計", value: `¥${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? "#0F6E56" : "#E24B4A" },
            { label: "売上合計", value: `¥${soldRevenue.toLocaleString()}`, color: "#185FA5" },
            { label: "確定利益", value: `¥${soldProfit.toLocaleString()}`, color: "#0F6E56" },
            { label: "商品数", value: `${parentItems.length}点`, color: "#1a1a1a" },
          ].map(c => (
            <div key={c.label} style={S.summaryCard}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 追加フォーム（編集中は非表示） */}
        {!inlineEditId && (
          <ItemForm data={form} setData={setForm} onSubmit={addItem} onCancel={null} isEdit={false} parentOptions={parentOptions} compact={false} />
        )}

        {/* 検索・フィルター・ソート */}
        <div style={{ marginBottom: 10 }}>
          <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="商品名・プラットフォームで検索..." style={{ ...S.input, marginBottom: 8 }} />
          <div style={S.filterRow}>
            {[{ value: "all", label: "すべて" }, ...STATUSES].map(st => (
              <button key={st.value} onClick={() => { setFilterStatus(st.value); setPage(1); }}
                style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, border: "0.5px solid #ddd", cursor: "pointer", fontFamily: "inherit", background: filterStatus === st.value ? "#1a1a1a" : "#fff", color: filterStatus === st.value ? "#fff" : "#555", fontWeight: filterStatus === st.value ? 600 : 400 }}>
                {st.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
              <SortBtn k="created_at" label="登録日" />
              <SortBtn k="name" label="商品名" />
              <SortBtn k="buy" label="仕入れ" />
              <SortBtn k="sell" label="出品価格" />
              <SortBtn k="profit" label="利益" />
              <SortBtn k="roi" label="ROI" />
            </div>
          </div>
        </div>

        <div style={S.listCard}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>読み込み中...</div>
          ) : pagedItems.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>商品がありません</div>
          ) : pagedItems.map(item => (
            <div key={item.id}>
              <ItemRow
                item={item}
                children={childrenOf(item.id)}
                isChild={false}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                updateStatus={updateStatus}
                setInlineEditId={handleInlineEdit}
                inlineEditId={inlineEditId}
                deleteItem={deleteItem}
                editFormElement={editItem ? (
                  <ItemForm
                    data={editItem}
                    setData={setEditItem}
                    onSubmit={updateItem}
                    onCancel={() => { setInlineEditId(null); setEditItem(null); }}
                    isEdit={true}
                    parentOptions={parentOptions}
                    compact={true}
                  />
                ) : null}
              />
              {inlineEditId === item.id && editItem && (
                <ItemForm
                  data={editItem}
                  setData={setEditItem}
                  onSubmit={updateItem}
                  onCancel={() => { setInlineEditId(null); setEditItem(null); }}
                  isEdit={true}
                  parentOptions={parentOptions}
                  compact={true}
                />
              )}
            </div>
          ))}
        </div>

        {/* ページング */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ ...S.btnSm, background: page === 1 ? "#f0f0f0" : "#1a1a1a", color: page === 1 ? "#aaa" : "#fff" }}>← 前へ</button>
            <span style={{ fontSize: 13, color: "#666" }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ ...S.btnSm, background: page === totalPages ? "#f0f0f0" : "#1a1a1a", color: page === totalPages ? "#aaa" : "#fff" }}>次へ →</button>
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: 11, color: "#bbb", textAlign: "center" }}>
          {filteredParents.length}件中 {Math.min((page - 1) * PAGE_SIZE + 1, filteredParents.length)}〜{Math.min(page * PAGE_SIZE, filteredParents.length)}件表示
        </p>
      </div>
    </div>
  );
}
