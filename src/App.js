import { useState, useEffect } from "react";

const PLATFORMS = ["Amazon", "メルカリ", "eBay", "ヤフオク"];
const STATUSES = [
  { value: "pending", label: "仕入れ済み", color: "#BA7517", bg: "#FAEEDA" },
  { value: "listed", label: "出品中", color: "#185FA5", bg: "#E6F1FB" },
  { value: "sold", label: "売却済み", color: "#0F6E56", bg: "#E1F5EE" },
];

const DEFAULT_ITEMS = [
  { id: 1, name: "ホロウナイト", platform: "Amazon", buy: 2999, shipIn: 0, sell: 5000, fee: 15, shipOut: 600, status: "listed" },
  { id: 2, name: "ブロリーSS4", platform: "eBay", buy: 7800, shipIn: 0, sell: 17363, fee: 13, shipOut: 3500, status: "pending" },
  { id: 3, name: "ブルマ B賞", platform: "eBay", buy: 12999, shipIn: 0, sell: 26193, fee: 13, shipOut: 3500, status: "pending" },
  { id: 4, name: "悟空SS4", platform: "eBay", buy: 3788, shipIn: 0, sell: 14287, fee: 13, shipOut: 3500, status: "pending" },
  { id: 5, name: "ブロリーSS4②", platform: "eBay", buy: 6499, shipIn: 0, sell: 17363, fee: 13, shipOut: 3500, status: "pending" },
];

function calcProfit(item) {
  const feeAmt = Math.round(item.sell * item.fee / 100);
  const totalCost = item.buy + item.shipIn + item.shipOut + feeAmt;
  const minSell = totalCost + 1;
  const profit = item.sell - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
  return { feeAmt, totalCost, profit, minSell, roi };
}

export default function App() {
  const [items, setItems] = useState([]);
  const [nextId, setNextId] = useState(6);
  const [form, setForm] = useState({ name: "", platform: "Amazon", buy: "", shipIn: "", sell: "", fee: "15", shipOut: "", status: "pending" });
  const [editId, setEditId] = useState(null);
  const [editSell, setEditSell] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("sedori_items");
      const savedNextId = localStorage.getItem("sedori_nextid");
      if (savedItems) setItems(JSON.parse(savedItems));
      else setItems(DEFAULT_ITEMS);
      if (savedNextId) setNextId(parseInt(savedNextId));
    } catch {
      setItems(DEFAULT_ITEMS);
    }
  }, []);

  const save = (newItems, newNextId) => {
    try {
      localStorage.setItem("sedori_items", JSON.stringify(newItems));
      localStorage.setItem("sedori_nextid", String(newNextId));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
  };

  const addItem = () => {
    if (!form.name || !form.sell) {
      alert("商品名と出品価格は必須です");
      return;
    }
    const newItem = {
      id: nextId,
      name: form.name,
      platform: form.platform,
      buy: parseFloat(form.buy) || 0,
      shipIn: parseFloat(form.shipIn) || 0,
      sell: parseFloat(form.sell) || 0,
      fee: parseFloat(form.fee) || 15,
      shipOut: parseFloat(form.shipOut) || 0,
      status: form.status,
    };
    const newItems = [...items, newItem];
    const newNextId = nextId + 1;
    setItems(newItems);
    setNextId(newNextId);
    save(newItems, newNextId);
    setForm({ name: "", platform: "Amazon", buy: "", shipIn: "", sell: "", fee: "15", shipOut: "", status: "pending" });
  };

  const deleteItem = (id) => {
    if (!window.confirm("削除しますか？")) return;
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    save(newItems, nextId);
  };

  const updateStatus = (id, status) => {
    const newItems = items.map(i => i.id === id ? { ...i, status } : i);
    setItems(newItems);
    save(newItems, nextId);
  };

  const updateSell = (id) => {
    const newItems = items.map(i => i.id === id ? { ...i, sell: parseFloat(editSell) || i.sell } : i);
    setItems(newItems);
    save(newItems, nextId);
    setEditId(null);
    setEditSell("");
  };

  const filtered = filterStatus === "all" ? items : items.filter(i => i.status === filterStatus);
  const totalInvest = items.reduce((s, i) => s + i.buy + i.shipIn, 0);
  const totalProfit = items.reduce((s, i) => s + calcProfit(i).profit, 0);
  const soldProfit = items.filter(i => i.status === "sold").reduce((s, i) => s + calcProfit(i).profit, 0);

  const styles = {
    app: { fontFamily: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif", padding: "1.5rem", maxWidth: 960, margin: "0 auto", color: "#1a1a1a", minHeight: "100vh", backgroundColor: "#f8f8f6" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" },
    title: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" },
    subtitle: { fontSize: 13, color: "#888", margin: "2px 0 0" },
    savedBadge: { fontSize: 12, color: "#0F6E56", background: "#E1F5EE", padding: "4px 12px", borderRadius: 99 },
    summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: "1.5rem" },
    summaryCard: { background: "#fff", borderRadius: 12, padding: "14px 16px", border: "0.5px solid #e5e5e5" },
    summaryLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
    formCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 },
    formLabel: { fontSize: 11, color: "#888", marginBottom: 3, display: "block" },
    input: { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" },
    select: { width: "100%", padding: "8px 10px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff" },
    addBtn: { width: "100%", padding: "10px 0", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    filterRow: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" },
    listCard: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, overflow: "hidden" },
    itemRow: { padding: "14px 16px", borderBottom: "0.5px solid #f0f0f0", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" },
    itemName: { fontWeight: 600, fontSize: 14 },
    badge: { fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 },
    platform: { fontSize: 11, color: "#aaa" },
    metaRow: { display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "#666", marginTop: 6 },
    actions: { display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" },
    statusSelect: { padding: "4px 8px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 11, cursor: "pointer", outline: "none", fontFamily: "inherit", background: "#fff" },
    deleteBtn: { padding: "4px 10px", border: "0.5px solid #ffd0d0", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "#fff7f7", color: "#E24B4A", fontFamily: "inherit" },
    warningBox: { marginTop: 6, fontSize: 11, color: "#E24B4A", background: "#FCEBEB", padding: "4px 10px", borderRadius: 6, display: "inline-block" },
    footer: { marginTop: 12, fontSize: 11, color: "#bbb", textAlign: "center" },
    emptyState: { padding: "2.5rem", textAlign: "center", color: "#aaa", fontSize: 13 },
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>せどり収支管理</h1>
          <p style={styles.subtitle}>RetroArc</p>
        </div>
        {saved && <span style={styles.savedBadge}>保存しました ✓</span>}
      </div>

      <div style={styles.summaryGrid}>
        {[
          { label: "総仕入れ額", value: `¥${totalInvest.toLocaleString()}`, color: "#1a1a1a" },
          { label: "予想利益合計", value: `¥${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? "#0F6E56" : "#E24B4A" },
          { label: "確定利益", value: `¥${soldProfit.toLocaleString()}`, color: "#0F6E56" },
          { label: "商品数", value: `${items.length}点`, color: "#185FA5" },
        ].map(card => (
          <div key={card.label} style={styles.summaryCard}>
            <div style={styles.summaryLabel}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.formCard}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#555" }}>商品を追加</div>
        <div style={styles.formGrid}>
          {[
            { key: "name", label: "商品名", type: "text", placeholder: "ブロリーフィギュア" },
            { key: "buy", label: "仕入れ価格（¥）", type: "number", placeholder: "7800" },
            { key: "shipIn", label: "仕入れ送料（¥）", type: "number", placeholder: "0" },
            { key: "sell", label: "出品価格（¥）", type: "number", placeholder: "17363" },
            { key: "fee", label: "手数料（%）", type: "number", placeholder: "15" },
            { key: "shipOut", label: "発送送料（¥）", type: "number", placeholder: "3500" },
          ].map(f => (
            <div key={f.key}>
              <label style={styles.formLabel}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={styles.input} />
            </div>
          ))}
          <div>
            <label style={styles.formLabel}>プラットフォーム</label>
            <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={styles.select}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.formLabel}>ステータス</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.select}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={addItem} style={styles.addBtn}>追加する</button>
      </div>

      <div style={styles.filterRow}>
        {[{ value: "all", label: "すべて" }, ...STATUSES].map(s => (
          <button key={s.value} onClick={() => setFilterStatus(s.value)}
            style={{ padding: "5px 14px", borderRadius: 99, fontSize: 12, border: "0.5px solid #ddd", cursor: "pointer", fontFamily: "inherit", background: filterStatus === s.value ? "#1a1a1a" : "#fff", color: filterStatus === s.value ? "#fff" : "#555", fontWeight: filterStatus === s.value ? 600 : 400 }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={styles.listCard}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>商品がありません。上のフォームから追加してください。</div>
        ) : filtered.map(item => {
          const { profit, minSell, roi } = calcProfit(item);
          const st = STATUSES.find(s => s.value === item.status);
          const isEditing = editId === item.id;
          const sellTooLow = item.sell < minSell;
          return (
            <div key={item.id} style={styles.itemRow}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={{ ...styles.badge, background: st.bg, color: st.color }}>{st.label}</span>
                  <span style={styles.platform}>{item.platform}</span>
                </div>
                <div style={styles.metaRow}>
                  <span>仕入れ <b style={{ color: "#1a1a1a" }}>¥{item.buy.toLocaleString()}</b></span>
                  <span>
                    出品価格{" "}
                    {isEditing ? (
                      <span>
                        <input type="number" value={editSell} onChange={e => setEditSell(e.target.value)}
                          style={{ width: 80, padding: "2px 6px", border: "1px solid #378ADD", borderRadius: 6, fontSize: 12, fontFamily: "inherit" }} />
                        <button onClick={() => updateSell(item.id)}
                          style={{ marginLeft: 4, padding: "2px 8px", background: "#378ADD", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>確定</button>
                        <button onClick={() => setEditId(null)}
                          style={{ marginLeft: 4, padding: "2px 8px", background: "#f0f0f0", color: "#555", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
                      </span>
                    ) : (
                      <b style={{ color: sellTooLow ? "#E24B4A" : "#1a1a1a", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => { setEditId(item.id); setEditSell(String(item.sell)); }}>
                        ¥{item.sell.toLocaleString()} ✎
                      </b>
                    )}
                  </span>
                  <span>最低販売額 <b style={{ color: "#E24B4A" }}>¥{minSell.toLocaleString()}</b></span>
                  <span>利益 <b style={{ color: profit >= 0 ? "#0F6E56" : "#E24B4A" }}>¥{profit.toLocaleString()}</b></span>
                  <span>ROI <b style={{ color: roi >= 20 ? "#0F6E56" : roi >= 0 ? "#BA7517" : "#E24B4A" }}>{roi}%</b></span>
                </div>
                {sellTooLow && (
                  <div style={styles.warningBox}>
                    ⚠ 出品価格が最低販売額を下回っています！¥{minSell.toLocaleString()}以上に設定してください
                  </div>
                )}
              </div>
              <div style={styles.actions}>
                <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)} style={styles.statusSelect}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={() => deleteItem(item.id)} style={styles.deleteBtn}>削除</button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={styles.footer}>データはブラウザに自動保存されます</p>
    </div>
  );
}
