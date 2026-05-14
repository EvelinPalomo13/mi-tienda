import { useState } from "react";

const QRCode = ({ value, size = 180 }) => (
  <img
    src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=000000`}
    alt="QR Code"
    style={{ borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
    width={size} height={size}
  />
);

const CATEGORIES = [
  { id: "Comida",           emoji: "🍔", label: "Comida" },
  { id: "Bebidas",          emoji: "🥤", label: "Bebidas" },
  { id: "Aseo del Hogar",   emoji: "🧹", label: "Aseo del Hogar" },
  { id: "Aseo Personal",    emoji: "🧴", label: "Aseo Personal" },
  { id: "Lavandería",       emoji: "👕", label: "Lavandería" },
  { id: "Otros",            emoji: "📦", label: "Otros" },
];

const INITIAL_PRODUCTS = [
  { id: 1,  name: "Papas Sabritas",     price: 18,  stock: 24, emoji: "🥔", category: "Comida" },
  { id: 2,  name: "Papas Takis",        price: 22,  stock: 16, emoji: "🌶️", category: "Comida" },
  { id: 3,  name: "Chocolate",          price: 25,  stock: 20, emoji: "🍫", category: "Comida" },
  { id: 4,  name: "Chicles",            price: 10,  stock: 40, emoji: "🍬", category: "Comida" },
  { id: 5,  name: "Refresco Cola",      price: 22,  stock: 18, emoji: "🥤", category: "Bebidas" },
  { id: 6,  name: "Refresco Naranja",   price: 22,  stock: 15, emoji: "🍊", category: "Bebidas" },
  { id: 7,  name: "Agua Natural",       price: 15,  stock: 30, emoji: "💧", category: "Bebidas" },
  { id: 8,  name: "Jabón para Trastes", price: 28,  stock: 12, emoji: "🍽️", category: "Aseo del Hogar" },
  { id: 9,  name: "Cloro",             price: 25,  stock: 10, emoji: "🧪", category: "Aseo del Hogar" },
  { id: 10, name: "Escoba",            price: 60,  stock: 5,  emoji: "🧹", category: "Aseo del Hogar" },
  { id: 11, name: "Shampoo",           price: 35,  stock: 14, emoji: "🧴", category: "Aseo Personal" },
  { id: 12, name: "Jabón de Baño",     price: 18,  stock: 20, emoji: "🧼", category: "Aseo Personal" },
  { id: 13, name: "Pasta Dental",      price: 28,  stock: 10, emoji: "🦷", category: "Aseo Personal" },
  { id: 14, name: "Papel de Baño",     price: 22,  stock: 25, emoji: "🧻", category: "Aseo Personal" },
  { id: 15, name: "Detergente",        price: 40,  stock: 12, emoji: "🫧", category: "Lavandería" },
  { id: 16, name: "Suavizante",        price: 35,  stock: 8,  emoji: "🌸", category: "Lavandería" },
  { id: 17, name: "Lavado (1 kg)",     price: 50,  stock: 99, emoji: "👕", category: "Lavandería" },
  { id: 18, name: "Pilas AA x2",       price: 30,  stock: 15, emoji: "🔋", category: "Otros" },
  { id: 19, name: "Foco LED",          price: 45,  stock: 8,  emoji: "💡", category: "Otros" },
];

const DEFAULT_CONFIG = {
  storeName: "Mi Tienda",
  primaryColor: "#e11d48",
  accentColor: "#f97316",
  bgColor: "#0f0f0f",
  currency: "MXN",
  phone: "",
  address: "",
  welcomeMsg: "¡Bienvenido! Agrega tu nombre y haz tu pedido fácilmente.",
  whatsAppNumber: "",   // Número con código de país, sin +, ej: 5215512345678
  callMeBotApiKey: "",  // API key de CallMeBot
  transferInfo: "",     // Datos bancarios para transferencia
  adminPassword: "1234", // Contraseña del panel admin
};

export default function App() {
  const [view, setView]                 = useState("store");
  const [products, setProducts]         = useState(INITIAL_PRODUCTS);
  const [cart, setCart]                 = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [config, setConfig]             = useState(DEFAULT_CONFIG);
  const [adminTab, setAdminTab]         = useState("inventory");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminInput, setAdminInput]       = useState("");
  const [paymentStep, setPaymentStep]   = useState("form");
  const [paymentMethod, setPaymentMethod] = useState(""); // "efectivo" | "transferencia"
  const [notification, setNotification] = useState(null);
  const [orders, setOrders]             = useState([]);
  const [newProduct, setNewProduct]     = useState({ name: "", price: "", stock: "", emoji: "📦", category: "Comida", image: "" });

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product) => {
    if (product.stock === 0) return notify("Sin stock disponible", "error");
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    notify(`${product.emoji} ${product.name} agregado`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = i.qty + delta;
      return newQty < 1 ? null : { ...i, qty: newQty };
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const sendWhatsAppAlert = async (order) => {
    if (!config.whatsAppNumber || !config.callMeBotApiKey) return;
    const lines = order.items.map(i => `  ${i.emoji} ${i.name} x${i.qty} = $${i.price * i.qty}`).join("%0A");
    const metodoPago = order.paymentMethod === "transferencia" ? "🏦 Transferencia" : "💵 Efectivo";
    const msg = `🛒 *NUEVO PEDIDO* 🛒%0A%0A👤 Cliente: *${order.customer}*%0A💳 Pago: *${metodoPago}*%0A📅 ${order.date}%0A%0A${lines}%0A%0A💰 *Total: $${order.total} ${config.currency}*`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${config.whatsAppNumber}&text=${msg}&apikey=${config.callMeBotApiKey}`;
    try { await fetch(url, { mode: "no-cors" }); } catch (_) {}
  };

  const confirmOrder = async () => {
    if (!customerName.trim()) { notify("Por favor escribe tu nombre", "error"); return; }
    if (!paymentMethod) { notify("Elige un método de pago", "error"); return; }
    setPaymentStep("processing");
    await new Promise(r => setTimeout(r, 1200));
    setProducts(prev => prev.map(p => {
      const item = cart.find(i => i.id === p.id);
      if (item) return { ...p, stock: Math.max(0, p.stock - item.qty) };
      return p;
    }));
    const order = {
      id: Date.now(),
      customer: customerName.trim(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      date: new Date().toLocaleString("es-MX"),
    };
    setOrders(prev => [order, ...prev]);
    sendWhatsAppAlert(order);
    setCart([]);
    setPaymentMethod("");
    setPaymentStep("done");
  };

  const c      = config.primaryColor;
  const accent = config.accentColor;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Syne:wght@700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${config.bgColor}; font-family: 'Space Grotesk', sans-serif; color: #f1f1f1; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${c}55; border-radius: 4px; }
    .badge { background: ${c}; color: white; border-radius: 999px; padding: 1px 7px; font-size: 11px; font-weight: 700; }
    .btn { border: none; cursor: pointer; border-radius: 12px; font-family: inherit; font-weight: 600; transition: all .15s; }
    .btn-primary { background: ${c}; color: white; padding: 12px 22px; font-size: 15px; }
    .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .4; transform: none; cursor: not-allowed; filter: none; }
    .btn-ghost { background: #ffffff12; color: #eee; padding: 10px 16px; font-size: 14px; }
    .btn-ghost:hover { background: #ffffff22; }
    .btn-sm { padding: 6px 14px; font-size: 13px; border-radius: 8px; }
    .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 18px; }
    input, select { background: #111; border: 1px solid #333; color: #eee; border-radius: 10px; padding: 10px 14px; font-family: inherit; font-size: 14px; width: 100%; outline: none; }
    input:focus, select:focus { border-color: ${c}; }
    label { font-size: 12px; color: #888; margin-bottom: 4px; display: block; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pop  { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
  `;

  // ── NAV ───────────────────────────────────────────────────────────────────
  const Nav = () => (
    <nav style={{ background:"#0f0f0fdd", backdropFilter:"blur(12px)", borderBottom:"1px solid #222", position:"sticky", top:0, zIndex:100 }}>
      <div style={{ maxWidth:560, margin:"0 auto", padding:"12px 14px", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"Syne", fontWeight:800, fontSize:16, background:`linear-gradient(90deg,${c},${accent})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {config.storeName}
          </div>
        </div>
        {[["store","🛒 Tienda"],["qr","📱 QR"]].map(([v,label]) => (
          <button key={v} className="btn btn-ghost btn-sm" onClick={() => { setView(v); setPaymentStep("form"); }}
            style={{ background:view===v?`${c}22`:"#ffffff0a", color:view===v?c:"#aaa", borderBottom:view===v?`2px solid ${c}`:"2px solid transparent", borderRadius:8 }}>
            {label}
          </button>
        ))}
        {cartCount > 0 && (
          <button className="btn btn-primary btn-sm" onClick={() => setView("cart")} style={{ position:"relative" }}>
            🛒 <span className="badge" style={{ position:"absolute", top:-6, right:-6 }}>{cartCount}</span>
          </button>
        )}
        <button onClick={() => { if(adminUnlocked){ setView("admin"); } else { setView("adminlogin"); } }}
          style={{ background:"none", border:"none", color:"#333", cursor:"pointer", fontSize:18, padding:"4px 6px", lineHeight:1 }} title="Admin">
          ⚙
        </button>
      </div>
    </nav>
  );

  // ── STORE ─────────────────────────────────────────────────────────────────
  const StoreView = () => {
    const [cat, setCat] = useState("Todos");
    const filtered = cat === "Todos" ? products : products.filter(p => p.category === cat);

    return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:16 }}>

        {/* Campo nombre cliente */}
        <div className="card" style={{ padding:16, marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:28 }}>👤</span>
          <div style={{ flex:1 }}>
            <label>¿Cómo te llamas? (para identificar tu pedido)</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Escribe tu nombre aquí..." style={{ fontWeight:600 }} />
          </div>
        </div>

        <p style={{ color:"#888", fontSize:13, marginBottom:14, textAlign:"center" }}>{config.welcomeMsg}</p>

        {/* Tabs categorías */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:18 }}>
          {[{ id:"Todos", emoji:"🏪", label:"Todos" }, ...CATEGORIES].map(({ id, emoji, label }) => (
            <button key={id} onClick={() => setCat(id)}
              style={{ whiteSpace:"nowrap", background:cat===id?c:"#ffffff12", color:cat===id?"white":"#aaa", border:"none", cursor:"pointer", borderRadius:999, padding:"7px 16px", fontFamily:"inherit", fontWeight:600, fontSize:13, flexShrink:0 }}>
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Grid productos */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {filtered.map(product => (
            <div key={product.id} className="card" style={{ padding:16, display:"flex", flexDirection:"column", gap:8, opacity:product.stock===0?.5:1 }}>
              <div style={{ width:"100%", height:110, borderRadius:10, overflow:"hidden", marginBottom:4, background:"#111", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {product.image
                  ? <img src={product.image} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize:42 }}>{product.emoji}</span>}
              </div>
              <div style={{ fontWeight:700, fontSize:14, textAlign:"center", lineHeight:1.3 }}>{product.name}</div>
              <div style={{ fontSize:11, color:"#666", textAlign:"center" }}>{product.category}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:c, fontWeight:800, fontSize:17 }}>${product.price}</span>
                <span style={{ fontSize:11, color:product.stock<5?"#f97316":"#555" }}>
                  {product.stock===0 ? "Agotado" : `${product.stock} disp.`}
                </span>
              </div>
              <button className="btn btn-primary" style={{ width:"100%", fontSize:13 }}
                onClick={() => addToCart(product)} disabled={product.stock===0}>
                {product.stock===0 ? "Agotado" : "+ Agregar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── CART ──────────────────────────────────────────────────────────────────
  const CartView = () => (
    <div style={{ maxWidth:560, margin:"0 auto", padding:16 }}>
      <h2 style={{ fontFamily:"Syne", fontSize:22, marginBottom:16 }}>🛒 Tu Carrito</h2>

      {/* Nombre en carrito */}
      <div className="card" style={{ padding:14, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:24 }}>👤</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Pedido de</div>
          {customerName ? (
            <div style={{ fontWeight:700, fontSize:16, color:c }}>{customerName}</div>
          ) : (
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Escribe tu nombre..." />
          )}
        </div>
        {customerName && (
          <button onClick={() => setCustomerName("")} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:16 }}>✏️</button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="card" style={{ padding:40, textAlign:"center", color:"#666" }}>
          <div style={{ fontSize:48 }}>🛒</div>
          <p style={{ marginTop:12 }}>Tu carrito está vacío</p>
          <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setView("store")}>Ver productos</button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.id} className="card" style={{ padding:14, marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:50, height:50, borderRadius:10, overflow:"hidden", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {item.image ? <img src={item.image} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:26 }}>{item.emoji}</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{item.name}</div>
                <div style={{ fontSize:11, color:"#666" }}>{item.category}</div>
                <div style={{ color:c, fontWeight:700, fontSize:13 }}>${item.price} c/u</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.id,-1)}>−</button>
                <span style={{ fontWeight:700, minWidth:20, textAlign:"center" }}>{item.qty}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.id,1)}>+</button>
              </div>
              <div style={{ fontWeight:800, minWidth:52, textAlign:"right", color:accent }}>${item.price*item.qty}</div>
              <button onClick={() => removeFromCart(item.id)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          ))}

          <div className="card" style={{ padding:18, marginTop:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:19, fontWeight:800, marginBottom:14 }}>
              <span>Total</span>
              <span style={{ color:c }}>${cartTotal} {config.currency}</span>
            </div>
            {!customerName.trim() && (
              <div style={{ background:"#f9731620", border:"1px solid #f9731644", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#f97316", marginBottom:12 }}>
                ⚠️ Escribe tu nombre antes de continuar
              </div>
            )}
            <button className="btn btn-primary" style={{ width:"100%", fontSize:16, padding:14 }}
              onClick={() => { setView("payment"); setPaymentStep("form"); }}
              disabled={!customerName.trim()}>
              📋 Ver resumen y confirmar pedido
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── CHECKOUT ──────────────────────────────────────────────────────────────
  const PaymentView = () => {
    const isTransfer = orders[0]?.paymentMethod === "transferencia";

    if (paymentStep==="processing") return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:60, textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16, display:"inline-block", animation:"spin 1s linear infinite" }}>⏳</div>
        <h2 style={{ fontFamily:"Syne" }}>Enviando pedido...</h2>
        <p style={{ color:"#888", marginTop:8 }}>Un momento por favor</p>
      </div>
    );

    if (paymentStep==="done") {
      const o = orders[0];
      const isT = o?.paymentMethod === "transferencia";
      return (
        <div style={{ maxWidth:560, margin:"0 auto", padding:40, textAlign:"center", animation:"pop .4s ease" }}>
          <div style={{ fontSize:72, marginBottom:12 }}>✅</div>
          <h2 style={{ fontFamily:"Syne", fontSize:26 }}>¡Pedido confirmado!</h2>
          <p style={{ color:"#888", marginTop:6 }}>{isT ? "Realiza tu transferencia para que procesemos el pedido" : "Paga en efectivo al recibir tu pedido"}</p>
          <div className="card" style={{ padding:20, marginTop:24, textAlign:"left" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:c }}>👤 {o?.customer}</div>
                <div style={{ fontSize:12, color:"#666" }}>{o?.date}</div>
              </div>
              <span style={{ background: isT?"#3b82f620":"#22c55e20", color: isT?"#3b82f6":"#22c55e", borderRadius:999, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
                {isT ? "🏦 Transferencia" : "💵 Efectivo"}
              </span>
            </div>
            <div style={{ borderTop:"1px solid #222", paddingTop:12, display:"flex", flexDirection:"column", gap:6 }}>
              {o?.items.map(i => (
                <div key={i.id} style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                  <span>{i.emoji} {i.name} ×{i.qty}</span>
                  <span style={{ color:"#aaa" }}>${i.price*i.qty}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop:"1px solid #333", marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:17 }}>
              <span>Total a pagar</span>
              <span style={{ color:c }}>${o?.total} {config.currency}</span>
            </div>
            {isT && config.transferInfo && (
              <div style={{ marginTop:14, background:"#3b82f615", border:"1px solid #3b82f633", borderRadius:10, padding:14, fontSize:13 }}>
                <div style={{ fontWeight:700, color:"#3b82f6", marginBottom:6 }}>🏦 Datos para transferir</div>
                <div style={{ color:"#ccc", whiteSpace:"pre-line", lineHeight:1.8 }}>{config.transferInfo}</div>
              </div>
            )}
            {!isT && (
              <div style={{ marginTop:14, background:"#22c55e15", border:"1px solid #22c55e33", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#22c55e" }}>
                💵 Paga en efectivo cuando recibas tu pedido
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ marginTop:24, width:"100%", padding:14 }}
            onClick={() => { setView("store"); setPaymentStep("form"); setCustomerName(""); }}>
            Hacer otro pedido
          </button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:16 }}>
        <h2 style={{ fontFamily:"Syne", fontSize:22, marginBottom:4 }}>📋 Confirmar Pedido</h2>
        <p style={{ color:"#888", fontSize:13, marginBottom:20 }}>Revisa tu pedido y elige cómo vas a pagar.</p>

        {/* Resumen */}
        <div className="card" style={{ padding:16, marginBottom:16 }}>
          <div style={{ fontWeight:700, color:"#888", fontSize:12, marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>Resumen</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, paddingBottom:12, borderBottom:"1px solid #222" }}>
            <span style={{ fontSize:22 }}>👤</span>
            <div>
              <div style={{ fontSize:12, color:"#888" }}>Pedido de</div>
              <div style={{ fontWeight:700, color:c, fontSize:15 }}>{customerName}</div>
            </div>
          </div>
          {cart.map(item => (
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:14 }}>{item.emoji} {item.name} <span style={{ color:"#888" }}>×{item.qty}</span></span>
              <span style={{ fontWeight:700 }}>${item.price*item.qty}</span>
            </div>
          ))}
          <div style={{ borderTop:"1px solid #333", marginTop:8, paddingTop:12, display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:18 }}>
            <span>Total</span>
            <span style={{ color:c }}>${cartTotal} {config.currency}</span>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>¿Cómo vas a pagar?</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          {[
            { id:"efectivo", emoji:"💵", label:"Efectivo", sub:"Pagas al recibir" },
            { id:"transferencia", emoji:"🏦", label:"Transferencia", sub:"Pagas por banco" },
          ].map(opt => (
            <div key={opt.id} onClick={() => setPaymentMethod(opt.id)}
              className="card"
              style={{ padding:16, textAlign:"center", cursor:"pointer", border: paymentMethod===opt.id ? `2px solid ${c}` : "1px solid #2a2a2a", background: paymentMethod===opt.id ? `${c}15` : "#1a1a1a", transition:"all .15s" }}>
              <div style={{ fontSize:32, marginBottom:6 }}>{opt.emoji}</div>
              <div style={{ fontWeight:700, fontSize:14 }}>{opt.label}</div>
              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{opt.sub}</div>
              {paymentMethod===opt.id && <div style={{ marginTop:8, color:c, fontSize:12, fontWeight:700 }}>✓ Seleccionado</div>}
            </div>
          ))}
        </div>

        {/* Info transferencia */}
        {paymentMethod==="transferencia" && config.transferInfo && (
          <div style={{ background:"#3b82f615", border:"1px solid #3b82f633", borderRadius:12, padding:14, marginBottom:16, fontSize:13 }}>
            <div style={{ fontWeight:700, color:"#3b82f6", marginBottom:6 }}>🏦 Datos para transferir</div>
            <div style={{ color:"#ccc", whiteSpace:"pre-line", lineHeight:1.8 }}>{config.transferInfo}</div>
          </div>
        )}
        {paymentMethod==="transferencia" && !config.transferInfo && (
          <div style={{ background:"#f9731620", border:"1px solid #f9731644", borderRadius:12, padding:14, marginBottom:16, fontSize:13, color:"#f97316" }}>
            ⚠️ Agrega tus datos bancarios en Admin → Config para que el cliente sepa a dónde transferir.
          </div>
        )}

        {!paymentMethod && (
          <div style={{ background:"#ffffff08", borderRadius:12, padding:12, marginBottom:16, fontSize:13, color:"#666", textAlign:"center" }}>
            Selecciona un método de pago para continuar
          </div>
        )}

        <button className="btn btn-primary" style={{ width:"100%", padding:16, fontSize:16 }}
          onClick={confirmOrder} disabled={!paymentMethod}>
          ✅ Confirmar Pedido
        </button>
        <button className="btn btn-ghost" style={{ width:"100%", marginTop:10 }} onClick={() => setView("cart")}>← Regresar al carrito</button>
      </div>
    );
  };

  // ── QR ────────────────────────────────────────────────────────────────────
  const QRView = () => {
    const appUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : "https://tu-tienda.vercel.app";
    return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:24, textAlign:"center" }}>
      <h2 style={{ fontFamily:"Syne", fontSize:24, marginBottom:8 }}>📱 Código QR</h2>
      <p style={{ color:"#888", marginBottom:28, fontSize:14 }}>Muéstralo para que tus clientes accedan a la tienda desde su celular</p>
      <div className="card" style={{ padding:32, display:"inline-block", marginBottom:20 }}>
        <QRCode value={appUrl} size={200} />
        <p style={{ marginTop:12, fontSize:12, color:"#888", wordBreak:"break-all", maxWidth:220 }}>{appUrl}</p>
        <p style={{ marginTop:8, fontSize:13, color:"#888" }}>{config.storeName}</p>
      </div>
      <div className="card" style={{ padding:16, marginTop:8, textAlign:"left" }}>
        <div style={{ fontWeight:700, marginBottom:12, color:c }}>📊 Resumen</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            ["🛍️","Productos",products.length],
            ["📦","En stock",products.filter(p=>p.stock>0).length],
            ["✅","Pedidos",orders.length],
            ["💰","Ingresos","$"+orders.reduce((s,o)=>s+o.total,0)],
          ].map(([emoji,label,val]) => (
            <div key={label} className="card" style={{ padding:14, textAlign:"center", background:"#111" }}>
              <div style={{ fontSize:22 }}>{emoji}</div>
              <div style={{ fontSize:20, fontWeight:800, color:c }}>{val}</div>
              <div style={{ fontSize:11, color:"#888" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding:14, marginTop:12, fontSize:13, color:"#666", display:"flex", gap:10, alignItems:"flex-start", textAlign:"left" }}>
        <span style={{ fontSize:20 }}>💡</span>
        <span>Imprime este QR y colócalo en la entrada para que los clientes pidan sin buscarte.</span>
      </div>
    </div>
  );
  };

  // ── ADMIN LOGIN ───────────────────────────────────────────────────────────
  const AdminLoginView = () => (
    <div style={{ maxWidth:360, margin:"80px auto", padding:24 }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52 }}>🔐</div>
        <h2 style={{ fontFamily:"Syne", fontSize:22, marginTop:8 }}>Panel Admin</h2>
        <p style={{ color:"#888", fontSize:13, marginTop:4 }}>Ingresa la contraseña para continuar</p>
      </div>
      <div className="card" style={{ padding:24, display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label>Contraseña</label>
          <input type="password" value={adminInput} onChange={e => setAdminInput(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (adminInput === config.adminPassword) {
                  setAdminUnlocked(true); setView("admin"); setAdminInput("");
                } else { notify("Contraseña incorrecta", "error"); setAdminInput(""); }
              }
            }}
            autoFocus />
        </div>
        <button className="btn btn-primary" style={{ padding:14, fontSize:15 }}
          onClick={() => {
            if (adminInput === config.adminPassword) {
              setAdminUnlocked(true); setView("admin"); setAdminInput("");
            } else { notify("Contraseña incorrecta", "error"); setAdminInput(""); }
          }}>
          Entrar
        </button>
        <button className="btn btn-ghost" onClick={() => setView("store")}>← Regresar</button>
      </div>
    </div>
  );

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const AdminView = () => {
    const tabs = ["inventory","orders","config"];
    const tabLabels = { inventory:"📦 Inventario", orders:"📋 Pedidos", config:"🎨 Config" };

    return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={{ fontFamily:"Syne", fontSize:22 }}>⚙️ Panel de Admin</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => { setAdminUnlocked(false); setView("store"); }}>🔒 Salir</button>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {tabs.map(t => (
            <button key={t} className="btn btn-sm" onClick={() => setAdminTab(t)}
              style={{ background:adminTab===t?c:"#ffffff12", color:adminTab===t?"white":"#aaa", border:"none", cursor:"pointer", borderRadius:8, fontFamily:"inherit", fontWeight:600, padding:"8px 14px", fontSize:13 }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* INVENTARIO */}
        {adminTab==="inventory" && (
          <div>
            <div className="card" style={{ padding:16, marginBottom:20 }}>
              <div style={{ fontWeight:700, marginBottom:12, color:c }}>+ Agregar Producto</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div><label>Nombre</label><input value={newProduct.name} onChange={e => setNewProduct(p=>({...p,name:e.target.value}))} placeholder="Nombre..." /></div>
                <div><label>Emoji</label><input value={newProduct.emoji} onChange={e => setNewProduct(p=>({...p,emoji:e.target.value}))} /></div>
                <div><label>Precio $</label><input type="number" value={newProduct.price} onChange={e => setNewProduct(p=>({...p,price:e.target.value}))} /></div>
                <div><label>Stock</label><input type="number" value={newProduct.stock} onChange={e => setNewProduct(p=>({...p,stock:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:10 }}>
                <label>Foto del producto (opcional)</label>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:60, height:60, borderRadius:10, overflow:"hidden", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {newProduct.image ? <img src={newProduct.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:28 }}>{newProduct.emoji||"📦"}</span>}
                  </div>
                  <label htmlFor="new-product-img" className="btn btn-ghost btn-sm" style={{ cursor:"pointer", display:"inline-block" }}>
                    📷 Subir foto
                  </label>
                  <input id="new-product-img" type="file" accept="image/*" style={{ display:"none" }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setNewProduct(p=>({...p, image: ev.target.result}));
                      reader.readAsDataURL(file);
                    }} />
                  {newProduct.image && <button className="btn btn-ghost btn-sm" onClick={() => setNewProduct(p=>({...p,image:""}))}>✕ Quitar</button>}
                </div>
              </div>
              <div style={{ marginBottom:12 }}><label>Categoría</label>
                <select value={newProduct.category} onChange={e => setNewProduct(p=>({...p,category:e.target.value}))}>
                  {CATEGORIES.map(({id,label}) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                if (!newProduct.name||!newProduct.price) return notify("Completa nombre y precio","error");
                setProducts(prev=>[...prev,{...newProduct,id:Date.now(),price:+newProduct.price,stock:+newProduct.stock||0}]);
                setNewProduct({name:"",price:"",stock:"",emoji:"📦",category:"Comida",image:""});
                notify("Producto agregado ✓");
              }}>Agregar Producto</button>
            </div>

            {/* Lista agrupada por categoría */}
            {CATEGORIES.map(({ id:catId, emoji:catEmoji, label:catLabel }) => {
              const catProds = products.filter(p => p.category===catId);
              if (catProds.length===0) return null;
              return (
                <div key={catId} style={{ marginBottom:20 }}>
                  <div style={{ fontWeight:700, color:"#777", fontSize:12, marginBottom:8, display:"flex", alignItems:"center", gap:6, textTransform:"uppercase", letterSpacing:1 }}>
                    {catEmoji} {catLabel}
                    <span style={{ background:"#ffffff10", borderRadius:999, padding:"1px 8px", fontSize:11, textTransform:"none", letterSpacing:0 }}>{catProds.length}</span>
                  </div>
                  {catProds.map(p => (
                    <div key={p.id} className="card" style={{ padding:13, marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:46, height:46, borderRadius:8, overflow:"hidden", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, position:"relative" }}>
                        {p.image ? <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:22 }}>{p.emoji}</span>}
                        <label htmlFor={"img-"+p.id} style={{ position:"absolute", inset:0, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.45)", opacity:0, transition:"opacity .2s" }}
                          onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                          <span style={{ fontSize:14 }}>📷</span>
                        </label>
                        <input id={"img-"+p.id} type="file" accept="image/*" style={{ display:"none" }}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setProducts(prev => prev.map(x => x.id===p.id ? {...x, image: ev.target.result} : x));
                            reader.readAsDataURL(file);
                          }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{p.name}</div>
                        <div style={{ fontSize:12, color:"#888" }}>${p.price}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))}>−</button>
                        <span style={{ minWidth:28, textAlign:"center", fontWeight:700, color:p.stock<5?"#f97316":"#eee" }}>{p.stock}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))}>+</button>
                      </div>
                      <button onClick={() => setProducts(prev=>prev.filter(x=>x.id!==p.id))}
                        style={{ background:"none", border:"none", color:"#e11d48", cursor:"pointer", fontSize:18 }}>🗑</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* PEDIDOS */}
        {adminTab==="orders" && (
          <div>
            {orders.length===0 ? (
              <div className="card" style={{ padding:40, textAlign:"center", color:"#666" }}>
                <div style={{ fontSize:40 }}>📋</div>
                <p style={{ marginTop:8 }}>Sin pedidos aún</p>
              </div>
            ) : (
              <>
                <div className="card" style={{ padding:16, marginBottom:16, display:"flex", justifyContent:"space-around", textAlign:"center" }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:24, color:c }}>{orders.length}</div>
                    <div style={{ fontSize:12, color:"#888" }}>Pedidos</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:24, color:accent }}>${orders.reduce((s,o)=>s+o.total,0)}</div>
                    <div style={{ fontSize:12, color:"#888" }}>Ingresos</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:24, color:"#22c55e" }}>{new Set(orders.map(o=>o.customer)).size}</div>
                    <div style={{ fontSize:12, color:"#888" }}>Clientes</div>
                  </div>
                </div>
                {orders.map(o => (
                  <div key={o.id} className="card" style={{ padding:16, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:16, color:c }}>👤 {o.customer}</div>
                        <div style={{ fontSize:12, color:"#666" }}>{o.date} · #{String(o.id).slice(-4)}</div>
                      </div>
                      <span style={{ fontWeight:800, color:accent, fontSize:16 }}>${o.total}</span>
                    </div>
                    <div style={{ borderTop:"1px solid #222", paddingTop:10, display:"flex", flexDirection:"column", gap:4 }}>
                      {o.items.map(i => (
                        <div key={i.id} style={{ fontSize:13, color:"#ccc", display:"flex", justifyContent:"space-between" }}>
                          <span>{i.emoji} {i.name} ×{i.qty}</span>
                          <span style={{ color:"#888" }}>${i.price*i.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* CONFIG */}
        {adminTab==="config" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><label>Nombre de la tienda</label>
              <input value={config.storeName} onChange={e => setConfig(p=>({...p,storeName:e.target.value}))} />
            </div>
            <div><label>Mensaje de bienvenida</label>
              <input value={config.welcomeMsg} onChange={e => setConfig(p=>({...p,welcomeMsg:e.target.value}))} />
            </div>
            <div><label>Teléfono</label>
              <input value={config.phone} onChange={e => setConfig(p=>({...p,phone:e.target.value}))} placeholder="+52 55 1234 5678" />
            </div>
            <div><label>Dirección</label>
              <input value={config.address} onChange={e => setConfig(p=>({...p,address:e.target.value}))} />
            </div>
            <div>
              <label>Datos bancarios para transferencia (banco, CLABE, número de cuenta, nombre)</label>
              <textarea value={config.transferInfo} onChange={e => setConfig(p=>({...p,transferInfo:e.target.value}))}
                placeholder={"Banco: BBVA\nCLABE: 012345678901234567\nTitular: Juan Pérez"}
                rows={4}
                style={{ background:"#111", border:"1px solid #333", color:"#eee", borderRadius:10, padding:"10px 14px", fontFamily:"inherit", fontSize:13, width:"100%", outline:"none", resize:"vertical" }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label>Color principal</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={config.primaryColor} onChange={e => setConfig(p=>({...p,primaryColor:e.target.value}))} style={{ width:48, height:40, padding:4, cursor:"pointer" }} />
                  <span style={{ fontSize:12, color:"#888" }}>{config.primaryColor}</span>
                </div>
              </div>
              <div><label>Color acento</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={config.accentColor} onChange={e => setConfig(p=>({...p,accentColor:e.target.value}))} style={{ width:48, height:40, padding:4, cursor:"pointer" }} />
                  <span style={{ fontSize:12, color:"#888" }}>{config.accentColor}</span>
                </div>
              </div>
            </div>
            <div><label>Color de fondo</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input type="color" value={config.bgColor} onChange={e => setConfig(p=>({...p,bgColor:e.target.value}))} style={{ width:48, height:40, padding:4, cursor:"pointer" }} />
                <span style={{ fontSize:12, color:"#888" }}>{config.bgColor}</span>
              </div>
            </div>
            <div><label>Moneda</label>
              <select value={config.currency} onChange={e => setConfig(p=>({...p,currency:e.target.value}))}>
                <option>MXN</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            {/* WhatsApp CallMeBot */}
            <div className="card" style={{ padding:16, background:"#25d36612", border:"1px solid #25d36630", display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>📲</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:"#25d366", fontSize:15 }}>Alertas por WhatsApp</div>
                  <div style={{ fontSize:12, color:"#888" }}>Te avisamos cada vez que llegue un pedido</div>
                </div>
                <span style={{ fontSize:11, background: config.whatsAppNumber && config.callMeBotApiKey ? "#25d36622":"#ffffff10", color: config.whatsAppNumber && config.callMeBotApiKey ? "#25d366":"#888", borderRadius:999, padding:"3px 10px", fontWeight:700, whiteSpace:"nowrap" }}>
                  {config.whatsAppNumber && config.callMeBotApiKey ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div>
                <label>Tu numero (con codigo de pais, sin +)</label>
                <input value={config.whatsAppNumber} onChange={e => setConfig(p=>({...p,whatsAppNumber:e.target.value.replace(/\D/g,"")}))}
                  placeholder="Ej: 5215512345678" />
              </div>
              <div>
                <label>API Key de CallMeBot</label>
                <input value={config.callMeBotApiKey} onChange={e => setConfig(p=>({...p,callMeBotApiKey:e.target.value}))}
                  placeholder="La recibes por WhatsApp al registrarte" />
              </div>
              <div style={{ background:"#00000040", borderRadius:10, padding:12, fontSize:12, color:"#aaa", lineHeight:1.9 }}>
                <strong style={{ color:"#25d366" }}>Como activar (solo 1 vez):</strong><br/>
                1. Guarda este numero en tu cel: <strong style={{ color:"#eee" }}>+34 644 75 89 61</strong><br/>
                2. Mandales por WhatsApp exactamente:<br/>
                <span style={{ color:"#eee", fontFamily:"monospace", background:"#ffffff10", padding:"2px 6px", borderRadius:4, display:"inline-block", marginTop:2 }}>I allow callmebot to send me messages</span><br/>
                3. En segundos recibes tu API Key por WhatsApp<br/>
                4. Pegala arriba y listo!
              </div>
            </div>

            <div>
              <label>Contraseña del Admin</label>
              <input type="password" value={config.adminPassword} onChange={e => setConfig(p=>({...p,adminPassword:e.target.value}))} placeholder="Nueva contraseña..." />
            </div>
            <div className="card" style={{ padding:12, background:"#e11d4815", border:"1px solid #e11d4833" }}>
              <div style={{ fontSize:13, color:"#e11d48" }}>Los cambios se aplican en tiempo real</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      {notification && (
        <div style={{ position:"fixed", top:76, left:"50%", transform:"translateX(-50%)", background:notification.type==="error"?"#e11d4890":"#22c55e90", backdropFilter:"blur(12px)", color:"white", padding:"10px 20px", borderRadius:12, fontWeight:600, zIndex:999, fontSize:14, border:`1px solid ${notification.type==="error"?"#e11d4860":"#22c55e60"}`, boxShadow:"0 4px 24px rgba(0,0,0,0.3)", whiteSpace:"nowrap" }}>
          {notification.msg}
        </div>
      )}
      <div style={{ minHeight:"100vh", background:config.bgColor }}>
        <Nav />
        <div style={{ paddingBottom:40 }}>
          {view==="store"   && <StoreView />}
          {view==="cart"    && <CartView />}
          {view==="payment" && <PaymentView />}
          {view==="qr"         && <QRView />}
          {view==="adminlogin"  && <AdminLoginView />}
          {view==="admin"      && adminUnlocked && <AdminView />}
        </div>
      </div>
    </>
  );
}
