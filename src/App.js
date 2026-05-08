import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";

// 🔥 지수님의 파이어베이스 연결 열쇠
const firebaseConfig = {
  apiKey: "AIzaSyCAjMabc8eWnv9DhMN_YRMIk-7HI-oob4U",
  authDomain: "plmn-happylunch.firebaseapp.com",
  projectId: "plmn-happylunch",
  storageBucket: "plmn-happylunch.firebasestorage.app",
  messagingSenderId: "880105236909",
  appId: "1:880105236909:web:4224bc57d5d454ffb79924",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ─── 기본 데이터 (이모지 및 초기 맛집 세팅) ─── */
const DEF_CATS = [
  { id: "c1", name: "한식", emoji: "🍚", sub: ["한정식", "분식", "국물류", "기타"], order: 0 },
  { id: "c2", name: "양식", emoji: "🍔", sub: ["햄버거", "피자", "파스타", "멕시칸", "브런치", "기타"], order: 1 },
  { id: "c3", name: "일식", emoji: "🍣", sub: ["라멘", "카레", "덮밥", "오코노미야끼", "우동", "돈까스", "샤브샤브", "소바", "기타"], order: 2 },
  { id: "c4", name: "중식", emoji: "🥟", sub: ["마라탕", "기타"], order: 3 },
  { id: "c5", name: "샐러드/샌드위치", emoji: "🥗", sub: ["샐러드", "샌드위치", "기타"], order: 4 },
  { id: "c6", name: "아시안", emoji: "🍜", sub: ["베트남", "인도"], order: 5 },
  { id: "c7", name: "카페", emoji: "☕", sub: [], order: 6 },
];

const DEF_RESTS = [
  { id: 1, cat: "c4", sub: "기타", name: "쮸즈", mapUrl: "", reviews: [] },
];

/* ─── 컬러 토큰 & 아이콘 등 ─── */
const C = {
  bg: "#f7f7f7",
  card: "#ffffff",
  ink: "#181c22",
  gray: "#b8b8b9",
  lightbg: "#f7f7f7",
  point: "#e7f63c",
  border: "#e2e2e2",
  muted: "#b8b8b9",
};
const R = 10;

function Stars({ value, onRate, size = 13 }) {
  const [hov, setHov] = useState(0);
  const n = Math.round(hov || value || 0);
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= n ? C.point : "none"}
          stroke={i <= n ? C.point : C.gray}
          strokeWidth="1.8"
          style={{ cursor: onRate ? "pointer" : "default", display: "block", flexShrink: 0 }}
          onMouseEnter={() => onRate && setHov(i)}
          onMouseLeave={() => onRate && setHov(0)}
          onClick={() => onRate?.(i)}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function avgRating(reviews) {
  if (!reviews?.length) return null;
  return (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);
}

const IcMap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IcEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1.5 13.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IcX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IcChev = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", display: "block" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IcGear = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IcUp = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IcDown = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IcCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const iBtn = (active) => ({
  width: 30,
  height: 30,
  borderRadius: R,
  border: "none",
  background: active ? C.point : "transparent",
  color: C.ink,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background .15s",
  flexShrink: 0,
});

const fieldLbl = { fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 };

const inp = (extra = {}) => ({
  border: `1.5px solid ${C.border}`,
  borderRadius: R,
  padding: "9px 13px",
  fontSize: 13.5,
  outline: "none",
  fontFamily: "inherit",
  background: C.card,
  color: C.ink,
  width: "100%",
  ...extra,
});

/* ─── 모달 (헤더 고정형) ─── */
function Modal({ title, onClose, width = 480, children }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(24,28,34,.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ background: C.card, borderRadius: R, width, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.14)", animation: "fu .2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px 20px", flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={iBtn()}><IcX /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 30px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);
    const colors = [C.point, "#ffffff", C.ink, "#a8e63c", "#f0ff70"];
    const particles = Array.from({ length: 100 }, () => ({
      x: W / 2, y: H / 2, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 4, r: Math.random() * 5 + 2, color: colors[Math.floor(Math.random() * colors.length)], life: 1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.55; p.life -= 0.018;
        if (p.life > 0) {
          alive = true; ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      });
      if (alive) animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10, borderRadius: R }} />;
}

function CatSideItem({ cat, selCat, selSub, onCat, onSub }) {
  const [open, setOpen] = useState(false);
  const isActive = selCat === cat.id;

  return (
    <div style={{ marginBottom: 1 }}>
      <button
        onClick={() => onCat(cat.id)}
        style={{
          display: "flex", alignItems: "center", width: "100%", padding: "6px 10px", borderRadius: R, border: "none",
          background: isActive && selSub === "all" ? "#e8e8e8" : "transparent", cursor: "pointer", gap: 8, transition: "background .15s", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
        <span style={{ flex: 1, textAlign: "left", fontWeight: isActive ? 600 : 400, fontSize: 13.5, color: C.ink }}>{cat.name}</span>
        
        {/* 🔥 화살표 클릭 시에만 하위 메뉴 열리도록 분리 (세로 높이 영향 없음) */}
        {cat.sub?.length > 0 && (
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((o) => !o);
            }} 
            style={{ color: C.muted, display: "flex", padding: 2 }}
          >
            <IcChev open={open} />
          </span>
        )}
      </button>

      {open &&
        cat.sub?.map((sub) => {
          const subActive = isActive && selSub === sub;
          return (
            <button
              key={sub}
              onClick={() => { onCat(cat.id); onSub(sub); }}
              style={{
                display: "flex", alignItems: "center", width: "100%", padding: "6px 10px 6px 36px", borderRadius: R, border: "none",
                background: subActive ? "#f0f0ee" : "transparent", cursor: "pointer", fontFamily: "inherit", transition: "background .15s",
              }}
            >
              <span style={{ flex: 1, textAlign: "left", fontSize: 12.5, fontWeight: subActive ? 600 : 400, color: subActive ? C.ink : C.muted }}>{sub}</span>
            </button>
          );
        })}
    </div>
  );
}

function ManageCatsModal({ cats, onClose, db }) {
  const [editing, setEditing] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [addingSubFor, setAddingSubFor] = useState(null);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const saveEditName = async () => {
    if (!newName.trim() || !editing) return;
    const cat = cats.find((c) => c.id === editing.catId);
    if (editing.type === "cat") {
      await updateDoc(doc(db, "cats_data", String(cat.id)), {
        name: newName.trim(),
        emoji: newEmoji.trim() || "",
      });
    } else {
      const newSub = [...cat.sub];
      newSub[editing.subIdx] = newName.trim();
      await updateDoc(doc(db, "cats_data", String(cat.id)), { sub: newSub });
    }
    setEditing(null);
    setNewName("");
    setNewEmoji("");
  };

  const delCat = async (id) => {
    if (window.confirm("정말 삭제하시겠어요? (휴지통으로 이동합니다)")) {
      await updateDoc(doc(db, "cats_data", String(id)), { isDeleted: true });
    }
  };

  const delSub = async (catId, idx) => {
    if (window.confirm("하위 카테고리를 정말 삭제하시겠어요?")) {
      const cat = cats.find((c) => c.id === catId);
      await updateDoc(doc(db, "cats_data", String(catId)), {
        sub: cat.sub.filter((_, i) => i !== idx),
      });
    }
  };

  const addCat = async () => {
    if (!newName.trim()) return;
    await addDoc(collection(db, "cats_data"), {
      name: newName.trim(),
      emoji: newEmoji.trim() || "",
      sub: [],
      order: cats.length,
      isDeleted: false,
    });
    setNewName("");
    setNewEmoji("");
    setAddingCat(false);
  };

  const addSub = async (catId) => {
    if (!newName.trim()) return;
    const cat = cats.find((c) => c.id === catId);
    await updateDoc(doc(db, "cats_data", String(catId)), {
      sub: [...(cat.sub || []), newName.trim()],
    });
    setNewName("");
    setAddingSubFor(null);
  };

  const moveCat = async (ci, dir) => {
    const newCats = [...cats];
    const temp = newCats[ci];
    newCats[ci] = newCats[ci + dir];
    newCats[ci + dir] = temp;
    await updateDoc(doc(db, "cats_data", String(newCats[ci].id)), { order: ci });
    await updateDoc(doc(db, "cats_data", String(newCats[ci + dir].id)), { order: ci + dir });
  };

  const moveSub = async (catId, si, dir) => {
    const cat = cats.find((c) => c.id === catId);
    const newSub = [...cat.sub];
    const temp = newSub[si];
    newSub[si] = newSub[si + dir];
    newSub[si + dir] = temp;
    await updateDoc(doc(db, "cats_data", String(catId)), { sub: newSub });
  };

  return (
    <Modal title="카테고리 관리" onClose={onClose} width={540}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cats.map((cat, ci) => (
          <div key={cat.id} style={{ border: `1.5px solid ${C.border}`, borderRadius: R, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", background: "#fafafa", gap: 8 }}>
              {editing?.type === "cat" && editing.catId === cat.id ? (
                <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8, alignItems: "center" }}>
                  <input autoFocus placeholder="이모지" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") setEditing(null); }} style={{ ...inp(), width: 60, padding: "4px", textAlign: "center", fontSize: 16 }} />
                  <input placeholder="이름" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") setEditing(null); }} style={{ ...inp(), flex: 1, padding: "4px 8px", fontSize: 13.5 }} />
                  <button onClick={saveEditName} style={{ ...iBtn(), background: C.point, color: C.ink, width: 28, height: 28 }}><IcCheck /></button>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{cat.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: C.ink }}>{cat.name}</span>
                </>
              )}

              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                <button onClick={() => moveCat(ci, -1)} style={{ ...iBtn(), color: C.muted, visibility: ci > 0 ? "visible" : "hidden" }}><IcUp /></button>
                <button onClick={() => moveCat(ci, 1)} style={{ ...iBtn(), color: C.muted, visibility: ci < cats.length - 1 ? "visible" : "hidden" }}><IcDown /></button>
                <button onClick={() => { setEditing({ type: "cat", catId: cat.id }); setNewName(cat.name); setNewEmoji(cat.emoji); }} style={{ ...iBtn(), color: C.muted }}><IcEdit /></button>
                <button onClick={() => delCat(cat.id)} style={{ ...iBtn(), color: C.muted }}><IcTrash /></button>
              </div>
            </div>

            <div style={{ padding: "6px 12px 10px 36px", background: C.card }}>
              {cat.sub?.map((sub, si) => (
                <div key={si} style={{ display: "flex", alignItems: "center", padding: "5px 0", gap: 6 }}>
                  {editing?.type === "sub" && editing.catId === cat.id && editing.subIdx === si ? (
                    <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8, alignItems: "center" }}>
                      <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") setEditing(null); }} style={{ ...inp(), flex: 1, padding: "4px 8px", fontSize: 13 }} />
                      <button onClick={saveEditName} style={{ ...iBtn(), background: C.point, color: C.ink, width: 28, height: 28 }}><IcCheck /></button>
                    </div>
                  ) : (
                    <span style={{ flex: 1, fontSize: 13, color: C.ink, fontWeight: 400 }}>{sub}</span>
                  )}
                  <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                    <button onClick={() => moveSub(cat.id, si, -1)} style={{ ...iBtn(), color: C.muted, visibility: si > 0 ? "visible" : "hidden" }}><IcUp /></button>
                    <button onClick={() => moveSub(cat.id, si, 1)} style={{ ...iBtn(), color: C.muted, visibility: si < cat.sub.length - 1 ? "visible" : "hidden" }}><IcDown /></button>
                    <button onClick={() => { setEditing({ type: "sub", catId: cat.id, subIdx: si }); setNewName(sub); }} style={{ ...iBtn(), color: C.muted }}><IcEdit /></button>
                    <button onClick={() => delSub(cat.id, si)} style={{ ...iBtn(), color: C.muted }}><IcTrash /></button>
                  </div>
                </div>
              ))}
              {addingSubFor === cat.id ? (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input autoFocus placeholder="하위 카테고리명" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSub(cat.id)} style={{ ...inp(), flex: 1, padding: "6px 10px", fontSize: 13 }} />
                  <button onClick={() => addSub(cat.id)} style={{ background: C.ink, color: "#fff", border: "none", borderRadius: R, padding: "0 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>추가</button>
                  <button onClick={() => { setAddingSubFor(null); setNewName(""); }} style={{ background: C.lightbg, border: "none", borderRadius: R, padding: "0 10px", cursor: "pointer", color: C.muted }}>취소</button>
                </div>
              ) : (
                <button onClick={() => { setAddingSubFor(cat.id); setNewName(""); }} style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, background: "none", border: `1.5px dashed ${C.border}`, borderRadius: R, padding: "5px 10px", cursor: "pointer", color: C.muted, fontSize: 12.5 }}>
                  <IcPlus /> 하위 추가
                </button>
              )}
            </div>
          </div>
        ))}

        {addingCat ? (
          <div style={{ border: `1.5px solid ${C.point}`, borderRadius: R, padding: "14px", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input autoFocus placeholder="이모지" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} style={{ ...inp(), width: 60, textAlign: "center" }} />
              <input placeholder="새 카테고리 이름" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} style={{ ...inp(), flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <button onClick={addCat} style={{ flex: 1, background: C.ink, color: "#fff", border: "none", borderRadius: R, padding: "10px 0", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>카테고리 추가 완료</button>
              <button onClick={() => { setAddingCat(false); setNewName(""); setNewEmoji(""); }} style={{ background: C.lightbg, border: "none", borderRadius: R, padding: "0 20px", cursor: "pointer", color: C.muted }}>취소</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setAddingCat(true); setNewName(""); setNewEmoji(""); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", background: C.card, border: `1.5px dashed ${C.border}`, borderRadius: R, cursor: "pointer", color: C.muted, fontSize: 13.5, fontWeight: 400 }}>
            <IcPlus /> 메인 카테고리 추가
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ─── 메인 앱 ─── */
export default function App() {
  const [cats, setCats] = useState([]);
  const [trashCats, setTrashCats] = useState([]);
  const [rests, setRests] = useState([]);
  const [trashRests, setTrashRests] = useState([]);

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, "cats_data"), (snap) => {
      let data = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      if (data.length === 0) {
        DEF_CATS.forEach((c) => setDoc(doc(db, "cats_data", String(c.id)), { ...c, isDeleted: false }));
      } else {
        setCats(data.filter(c => c.isDeleted !== true).sort((a, b) => (a.order || 0) - (b.order || 0)));
        setTrashCats(data.filter(c => c.isDeleted === true));
      }
    });

    const unsubRests = onSnapshot(collection(db, "rests_data"), (snap) => {
      let data = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      if (data.length === 0) {
        DEF_RESTS.forEach((r) => setDoc(doc(db, "rests_data", String(r.id)), { ...r, isDeleted: false }));
      } else {
        setRests(data.filter(r => r.isDeleted !== true));
        setTrashRests(data.filter(r => r.isDeleted === true));
      }
    });

    return () => {
      unsubCats();
      unsubRests();
    };
  }, []);

  const [selCat, setSelCat] = useState("all");
  const [selSub, setSelSub] = useState("all");
  const [selId, setSelId] = useState(null);

  const [modal, setModal] = useState(null);
  const [md, setMd] = useState(null);

  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  const [pick, setPick] = useState(null);
  const [pickType, setPickType] = useState(null);
  const [pickAnim, setPickAnim] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const [rForm, setRForm] = useState({ name: "", cat: "", sub: "", mapUrl: "" });
  const [revForm, setRevForm] = useState({ text: "", author: "", rating: 5 });
  const [editingRevId, setEditingRevId] = useState(null);
  
  // 🔥 정렬 토글 상태 (오름/내림차순 추가)
  const [sortConfig, setSortConfig] = useState({ key: "newest", dir: "desc" });

  const catOf = (id) => cats?.find((c) => c.id === id) || trashCats?.find((c) => c.id === id);

  const filtered = (
    rests?.filter((r) => {
      if (selCat === "trash") return false; 
      if (selCat !== "all" && r.cat !== selCat) return false;
      if (selSub !== "all" && r.sub !== selSub) return false;
      return true;
    }) || []
  ).sort((a, b) => {
    // 🔥 등록순/이름순 및 방향에 따른 정렬 로직 적용
    if (sortConfig.key === "newest") {
      const cmp = String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
      return sortConfig.dir === "desc" ? -cmp : cmp;
    }
    if (sortConfig.key === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortConfig.dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });

  const selected = selId ? rests?.find((r) => r.id === selId) : null;

  const doRandom = (type) => {
    let pool = [];
    if (type === "cat") {
      cats.forEach((c) => {
        if (c.sub && c.sub.length > 0) {
          c.sub.forEach((s) => pool.push({ type: "sub", name: s, parentName: c.name, emoji: c.emoji }));
        } else {
          pool.push({ type: "main", name: c.name, parentName: c.name, emoji: c.emoji });
        }
      });
    } else {
      pool = filtered;
    }

    if (!pool?.length || spinning) return;
    setSpinning(true); setPick(null); setPickAnim(false); setPickType(type);
    let c = 0;
    const iv = setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++c > 16) {
        clearInterval(iv); setSpinning(false); setPickAnim(true); setConfettiKey((k) => k + 1); setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 2200);
      }
    }, 70);
  };

  /* CRUD 함수들 */
  const saveRest = async () => {
    if (!rForm.name.trim()) return;
    if (md?.id) {
      await updateDoc(doc(db, "rests_data", String(md.id)), rForm);
    } else {
      await addDoc(collection(db, "rests_data"), { ...rForm, reviews: [], isDeleted: false });
    }
    setModal(null); setMd(null);
  };

  const delRest = async (id) => {
    try {
      await updateDoc(doc(db, "rests_data", String(id)), { isDeleted: true });
      if (selId === id) setSelId(null);
      setModal(null); setMd(null);
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const restoreCat = async (id) => await updateDoc(doc(db, "cats_data", String(id)), { isDeleted: false });
  const hardDelCat = async (id) => {
    if (window.confirm("카테고리를 영구 삭제하시겠습니까? 복구할 수 없습니다.")) await deleteDoc(doc(db, "cats_data", String(id)));
  };
  const restoreRest = async (id) => await updateDoc(doc(db, "rests_data", String(id)), { isDeleted: false });
  const hardDelRest = async (id) => {
    if (window.confirm("맛집을 영구 삭제하시겠습니까? 복구할 수 없습니다.")) await deleteDoc(doc(db, "rests_data", String(id)));
  };

  const saveReview = async () => {
    if (!selId) return;
    const author = revForm.author?.trim();
    if (!author) { alert("리뷰 작성자의 이름을 입력해주세요."); return; }
    const text = revForm.text?.trim() || "";

    let updatedReviews;
    if (editingRevId) {
      updatedReviews = selected.reviews.map((rv) => rv.id === editingRevId ? { ...rv, text, author, rating: revForm.rating } : rv);
    } else {
      updatedReviews = [...(selected.reviews || []), { id: Date.now(), text, author, rating: revForm.rating }];
    }
    await updateDoc(doc(db, "rests_data", String(selId)), { reviews: updatedReviews });
    setRevForm({ text: "", author: "", rating: 5 }); setEditingRevId(null);
  };

  const delReview = async (rid, revId) => {
    const rest = rests.find((r) => r.id === rid);
    await updateDoc(doc(db, "rests_data", String(rid)), { reviews: rest.reviews.filter((rv) => rv.id !== revId) });
  };

  const listTitle = selCat === "trash" ? "휴지통" : (selCat === "all" ? "전체 맛집" : (selSub !== "all" ? `${catOf(selCat)?.name} · ${selSub}` : catOf(selCat)?.name || "맛집"));

  if (!cats?.length && !rests?.length && !trashCats?.length && !trashRests?.length) {
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>데이터 연결 중...</div>;
  }

  return (
    <div>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        html, body { min-height: 100vh; background-color: ${C.bg}; margin: 0; padding: 0; }
        * { box-sizing: border-box; font-family: 'Pretendard', sans-serif !important; }
        @keyframes fu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pi { 0%{transform:scale(.85);opacity:.2} 65%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        input:focus, select:focus, textarea:focus { border-color: ${C.point} !important; outline: none; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        .row-hover:hover { background: #f8f8f8 !important; }
        .main-grid { display: grid; grid-template-columns: 260px 1fr 360px; column-gap: 0; row-gap: 16px; padding: 80px 16px 80px 48px; max-width: 1360px; margin: 0 auto; height: 100vh; align-items: start; }
        .left-panel { padding-right: 60px; } .center-panel { margin-right: 10px; }
        @media (max-width: 1000px) { .main-grid { grid-template-columns: 240px 1fr; grid-template-rows: auto auto; height: auto; min-height: 100vh; } .center-panel { margin-right: 0; } .right-panel { grid-column: 2; grid-row: 2; } }
        @media (max-width: 700px) { .main-grid { grid-template-columns: 1fr; padding: 16px; } .left-panel { position: static !important; padding-right: 0; } .center-panel { margin-right: 0; } .right-panel { grid-column: 1; grid-row: 3; } }
      `}</style>

      <div className="main-grid">
        <div className="left-panel" style={{ position: "sticky", top: 40, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
          <div style={{ marginTop: -24, marginBottom: 36 }}>
            <h1 style={{ fontSize: 45, fontWeight: 100, color: C.ink, letterSpacing: -1, lineHeight: 1.2, marginBottom: 8 }}>점심 🍙<br />뭐 먹지?</h1>
            <div style={{ fontSize: 13.5, fontWeight: 200, color: C.gray }}>팔로미노 맛집 아카이브</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13.5, fontWeight: 300, color: C.ink, display: "block", marginBottom: 10 }}>랜덤 추천</span>
            <div style={{ position: "relative" }}>
              <button onClick={() => doRandom("rest")} disabled={spinning} style={{ display: "block", width: "100%", padding: "16px", background: C.point, border: "none", borderRadius: R, fontWeight: 600, fontSize: 13, color: C.ink, cursor: spinning ? "not-allowed" : "pointer", marginBottom: 8, opacity: spinning ? 0.7 : 1 }}>맛집 골라줘</button>
              <button onClick={() => doRandom("cat")} disabled={spinning} style={{ display: "block", width: "100%", padding: "16px", background: C.ink, border: "none", borderRadius: R, fontWeight: 500, fontSize: 13, color: "#fff", cursor: spinning ? "not-allowed" : "pointer", opacity: spinning ? 0.7 : 1 }}>카테고리 골라줘</button>
            </div>

            <div style={{ marginTop: 10, borderRadius: R, height: 110, position: "relative", overflow: "hidden" }}>
              {pick ? (
                <div style={{ borderRadius: R, padding: "12px 14px", background: C.card, border: `1.5px solid ${pickAnim ? C.point : C.border}`, animation: pickAnim ? "pi .3s ease" : "none", position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", cursor: pickType === "rest" ? "pointer" : "default" }} onClick={() => pickType === "rest" && setSelId(pick.id)}>
                  <Confetti key={confettiKey} active={confettiActive} />
                  {pickType === "rest" ? (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pick.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{catOf(pick.cat)?.emoji} {catOf(pick.cat)?.name}{pick.sub ? ` · ${pick.sub}` : ""}</div>
                      {pick.mapUrl ? <a href={pick.mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.point, color: C.ink, borderRadius: R, padding: "4px 10px", fontSize: 11.5, fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}><IcMap /> 네이버 지도</a> : <div style={{ height: 24 }} />}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{pick.emoji}</div>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink, marginBottom: 3 }}>
                        {pick.name}{pick.name !== pick.parentName && <span style={{ fontSize: 12, fontWeight: 400, color: C.gray }}> - {pick.parentName}</span>}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ borderRadius: R, position: "absolute", inset: 0, background: C.card, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: C.muted }}>결과가 여기에 표시돼요</span></div>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 300, color: C.ink }}>카테고리</span>
              <button onClick={() => setModal("manageCats")} style={{ ...iBtn(), width: 28, height: 28, color: C.muted }}><IcGear /></button>
            </div>

            <button
              onClick={() => { setSelCat("all"); setSelSub("all"); setSelId(null); }}
              style={{ display: "flex", alignItems: "center", width: "100%", padding: "6px 10px", borderRadius: R, border: "none", background: selCat === "all" ? "#e8e8e8" : "transparent", cursor: "pointer", gap: 8, marginBottom: 2 }}
            >
              <span style={{ fontSize: 16 }}>🍽️</span>
              <span style={{ flex: 1, textAlign: "left", fontWeight: selCat === "all" ? 600 : 400, fontSize: 13.5, color: C.ink }}>전체</span>
              {/* 🔥 '전체' 카테고리에만 우측에 총 맛집 갯수 표시 */}
              <span style={{ fontSize: 11.5, color: selCat === "all" ? C.ink : C.muted }}>{rests?.length || 0}</span>
            </button>
            
            {cats.map((cat) => (
              <CatSideItem key={cat.id} cat={cat} selCat={selCat} selSub={selSub} onCat={(id) => { setSelCat(id); setSelSub("all"); setSelId(null); }} onSub={setSelSub} />
            ))}

            <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
              <button
                onClick={() => { setSelCat("trash"); setSelSub("all"); setSelId(null); }}
                style={{
                  display: "flex", alignItems: "center", width: "100%", padding: "6px 10px", borderRadius: R, border: "none",
                  background: selCat === "trash" ? "#fce8e8" : "transparent", cursor: "pointer", gap: 8, transition: "background .15s"
                }}
              >
                <span style={{ fontSize: 16 }}>🗑️</span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: selCat === "trash" ? 600 : 400, fontSize: 13.5, color: selCat === "trash" ? "#e44" : C.ink }}>휴지통</span>
              </button>
            </div>
          </div>
        </div>

        <div className="center-panel" style={{ background: C.card, borderRadius: R, display: "flex", flexDirection: "column", height: "calc(90vh)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", flexShrink: 0 }}>
            <span style={{ fontWeight: 300, fontSize: 14, color: C.ink }}>{listTitle}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selCat !== "trash" ? (
                <>
                  {/* 🔥 셀렉트 박스 대신 토글 버튼 UI 적용 */}
                  <div style={{ display: "flex", alignItems: "center", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: R, height: 36, padding: "0 4px" }}>
                    <button
                      onClick={() => {
                        if (sortConfig.key === "newest") {
                          setSortConfig({ key: "newest", dir: sortConfig.dir === "desc" ? "asc" : "desc" });
                        } else {
                          setSortConfig({ key: "newest", dir: "desc" });
                        }
                      }}
                      style={{
                        background: sortConfig.key === "newest" ? C.lightbg : "transparent",
                        border: "none",
                        borderRadius: R - 4,
                        padding: "0 10px",
                        height: 26,
                        fontSize: 12,
                        fontWeight: sortConfig.key === "newest" ? 600 : 400,
                        color: sortConfig.key === "newest" ? C.ink : C.muted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "background 0.2s",
                      }}
                    >
                      등록순 {sortConfig.key === "newest" && (sortConfig.dir === "desc" ? "↓" : "↑")}
                    </button>
                    <button
                      onClick={() => {
                        if (sortConfig.key === "name") {
                          setSortConfig({ key: "name", dir: sortConfig.dir === "asc" ? "desc" : "asc" });
                        } else {
                          setSortConfig({ key: "name", dir: "asc" });
                        }
                      }}
                      style={{
                        background: sortConfig.key === "name" ? C.lightbg : "transparent",
                        border: "none",
                        borderRadius: R - 4,
                        padding: "0 10px",
                        height: 26,
                        fontSize: 12,
                        fontWeight: sortConfig.key === "name" ? 600 : 400,
                        color: sortConfig.key === "name" ? C.ink : C.muted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "background 0.2s",
                      }}
                    >
                      이름순 {sortConfig.key === "name" && (sortConfig.dir === "asc" ? "↓" : "↑")}
                    </button>
                  </div>

                  <button onClick={() => { setRForm({ name: "", cat: cats[0]?.id || "", sub: "", mapUrl: "" }); setModal("addRest"); }} style={{ display: "flex", alignItems: "center", gap: 6, background: C.ink, color: "#fff", border: "none", borderRadius: R, padding: "0 14px", height: 36, fontSize: 13, fontWeight: 500, cursor: "pointer" }}><IcPlus /> 맛집 추가</button>
                </>
              ) : (
                <span style={{ fontSize: 12, color: C.muted }}>삭제된 항목들</span>
              )}
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1, padding: "2px 8px" }}>
            {selCat === "trash" ? (
              <>
                {trashCats.length === 0 && trashRests.length === 0 && (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: C.gray }}><div style={{ fontSize: 28, marginBottom: 8 }}>🗑️</div><div style={{ fontSize: 13 }}>휴지통이 비어있어요</div></div>
                )}
                {trashCats.map((cat) => (
                  <div key={`cat-${cat.id}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px", borderRadius: R, borderBottom: `1px solid ${C.lightbg}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: R, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat.emoji || "📁"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 4 }}>{cat.name}</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>카테고리</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => restoreCat(cat.id)} style={{ border: "none", borderRadius: R, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: C.ink, color: "#fff" }}>복구</button>
                      <button onClick={() => hardDelCat(cat.id)} style={{ border: "none", borderRadius: R, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#ffebeb", color: "#e44" }}>영구삭제</button>
                    </div>
                  </div>
                ))}
                {trashRests.map((r) => {
                  const cat = catOf(r.cat);
                  return (
                    <div key={`rest-${r.id}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px", borderRadius: R, borderBottom: `1px solid ${C.lightbg}` }}>
                      <div style={{ width: 44, height: 44, borderRadius: R, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat?.emoji || "🍽️"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 4 }}>{r.name}</div>
                        <div style={{ fontSize: 11.5, color: C.muted }}>맛집 · {cat?.name || "알 수 없음"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => restoreRest(r.id)} style={{ border: "none", borderRadius: R, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: C.ink, color: "#fff" }}>복구</button>
                        <button onClick={() => hardDelRest(r.id)} style={{ border: "none", borderRadius: R, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#ffebeb", color: "#e44" }}>영구삭제</button>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {filtered.length === 0 && <div style={{ padding: "60px 20px", textAlign: "center", color: C.gray }}><div style={{ fontSize: 28, marginBottom: 8 }}></div><div style={{ fontSize: 13 }}>등록된 맛집이 없어요</div></div>}
                {filtered.map((r) => {
                  const cat = catOf(r.cat);
                  const ar = avgRating(r.reviews);
                  const isSel = selId === r.id;
                  return (
                    <div key={r.id}>
                      <div className="row-hover" onClick={() => { setSelId(isSel ? null : r.id); setEditingRevId(null); setRevForm({ text: "", author: "", rating: 5 }); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 12px", borderRadius: R, cursor: "pointer", background: isSel ? "#f8ffd8" : "transparent" }}>
                        <div style={{ width: 44, height: 44, borderRadius: R, background: isSel ? "#eeffa0" : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat?.emoji || "🍽️"}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Stars value={parseFloat(ar || 0)} size={12} /><span style={{ fontSize: 12, color: C.muted }}>{ar || ""}</span><span style={{ fontSize: 11.5, color: C.gray }}>({r.reviews?.length || 0})</span>{r.sub && <span style={{ fontSize: 10, color: C.muted, border: `1px solid ${C.gray}`, borderRadius: 5, padding: "1px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.sub}</span>}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                          <button onClick={(e) => { e.stopPropagation(); r.mapUrl && window.open(r.mapUrl, "_blank"); }} style={{ width: 34, height: 34, borderRadius: R, border: "none", background: r.mapUrl ? C.point : C.lightbg, color: r.mapUrl ? C.ink : C.gray, display: "flex", alignItems: "center", justifyContent: "center", cursor: r.mapUrl ? "pointer" : "default" }}><IcMap /></button>
                          <button onClick={(e) => { e.stopPropagation(); setRForm({ name: r.name, cat: r.cat, sub: r.sub, mapUrl: r.mapUrl || "" }); setModal("editRest"); setMd(r); }} style={{ ...iBtn(), width: 30, height: 30, color: C.muted }}><IcEdit /></button>
                          <button onClick={(e) => { e.stopPropagation(); setModal("delRest"); setMd(r); }} style={{ ...iBtn(), width: 30, height: 30, color: "#e44" }}><IcTrash /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="right-panel" style={{ position: "sticky", top: 40 }}>
          {selected ? (
            <div style={{ background: C.card, borderRadius: R, overflow: "hidden", animation: "fu .2s ease", maxHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 20px 16px", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 8 }}>{selected.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ border: `1px solid ${C.gray}`, color: C.muted, borderRadius: 6, padding: "1px 7px", fontSize: 11.5 }}>{catOf(selected.cat)?.emoji} {catOf(selected.cat)?.name}</span>
                      {selected.sub && <span style={{ border: `1px solid ${C.gray}`, color: C.muted, borderRadius: 6, padding: "1px 7px", fontSize: 11.5 }}>{selected.sub}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setRForm({ name: selected.name, cat: selected.cat, sub: selected.sub, mapUrl: selected.mapUrl || "" }); setModal("editRest"); setMd(selected); }} style={{ ...iBtn(), width: 28, height: 28, color: C.muted }}><IcEdit /></button>
                    <button onClick={() => { setModal("delRest"); setMd(selected); }} style={{ ...iBtn(), width: 28, height: 28, color: "#e44" }}><IcTrash /></button>
                    <button onClick={() => { setSelId(null); setEditingRevId(null); }} style={{ ...iBtn(), width: 28, height: 28, color: C.muted }}><IcX /></button>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <Stars value={parseFloat(avgRating(selected.reviews) || 0)} size={16} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>{avgRating(selected.reviews) || ""}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{selected.reviews?.length || 0}개 리뷰</span>
                </div>
                {selected.mapUrl ? <a href={selected.mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.point, color: C.ink, borderRadius: R, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}><IcMap /> 네이버 지도</a> : <div style={{ background: C.bg, borderRadius: R, padding: "9px 14px", color: C.gray, fontSize: 13, display: "inline-block" }}>지도 링크 없음</div>}
              </div>

              <div style={{ overflowY: "auto", flex: 1, padding: "20px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 10 }}>리뷰</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {!selected.reviews || selected.reviews.length === 0 ? <div style={{ color: C.gray, fontSize: 13, padding: "14px 0", textAlign: "center" }}>첫 리뷰를 남겨보세요!</div> : selected.reviews.map((rv, i) => (
                    <div key={rv.id || i} style={{ background: editingRevId === rv.id ? "#f8ffd8" : "#fff", border: `1px solid ${editingRevId === rv.id ? C.point : C.border}`, borderRadius: R, padding: "11px 14px", transition: "background 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: rv.text ? 7 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Stars value={rv.rating || 0} size={13} /><span style={{ fontWeight: 500, fontSize: 12, color: C.gray }}>{rv.author}</span></div>
                        <div style={{ display: "flex", gap: 0 }}>
                          <button onClick={() => { setEditingRevId(rv.id); setRevForm({ text: rv.text, author: rv.author, rating: rv.rating || 5 }); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 12 }}>수정</button>
                          <button onClick={() => delReview(selected.id, rv.id || i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, display: "flex", padding: 2 }}><IcX /></button>
                        </div>
                      </div>
                      {rv.text && <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, fontWeight: 300, whiteSpace: "pre-wrap" }}>{rv.text}</div>}
                    </div>
                  ))}
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: editingRevId ? C.ink : C.muted }}>{editingRevId ? " 리뷰 수정하기" : "리뷰 남기기"}</div>
                    {editingRevId && <button onClick={() => { setEditingRevId(null); setRevForm({ text: "", author: "", rating: 5 }); }} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 11 }}>수정 취소</button>}
                  </div>
                  <div style={{ display: "flex", gap: 15, marginBottom: 8, alignItems: "center" }}>
                    <input placeholder="이름" value={revForm.author} onChange={(e) => setRevForm((p) => ({ ...p, author: e.target.value }))} style={{ ...inp(), width: 100, flex: "none", fontSize: 13, padding: "8px 10px" }} />
                    <Stars value={revForm.rating} onRate={(n) => setRevForm((p) => ({ ...p, rating: n }))} size={20} />
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <textarea placeholder="리뷰를 입력하세요 (선택)" value={revForm.text} onChange={(e) => setRevForm((p) => ({ ...p, text: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && saveReview()} rows={3} style={{ ...inp(), flex: 1, fontSize: 13, padding: "8px 10px", resize: "none", lineHeight: 1.5 }} />
                    <button onClick={saveReview} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: editingRevId ? C.point : C.ink, color: editingRevId ? C.ink : "#fff", border: "none", borderRadius: R, padding: "0 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", alignSelf: "flex-start", height: 35, transition: "background 0.2s" }}>{editingRevId ? <IcCheck /> : "등록"}</button>
                  </div>
                </div>
              </div>
            </div>
          ) : <div style={{ background: C.card, borderRadius: R, padding: "60px 20px", textAlign: "center", color: C.gray }}><div style={{ fontSize: 32, marginBottom: 10 }}></div><div style={{ fontSize: 13, lineHeight: 1.7 }}>맛집을 선택하면<br />상세 정보를 볼 수 있어요</div></div>}
        </div>
      </div>

      {modal === "manageCats" && <ManageCatsModal cats={cats} onClose={() => setModal(null)} db={db} />}

      {(modal === "addRest" || modal === "editRest") && (
        <Modal title={modal === "addRest" ? " 맛집 추가" : " 맛집 수정"} onClose={() => { setModal(null); setMd(null); }}>
          <div style={{ marginBottom: 13 }}><div style={fieldLbl}>맛집 이름 *</div><input style={inp()} placeholder="예: 황금 삼겹살" value={rForm.name} onChange={(e) => setRForm((p) => ({ ...p, name: e.target.value }))} /></div>
          <div style={{ marginBottom: 13 }}><div style={fieldLbl}>카테고리</div><select value={rForm.cat} onChange={(e) => { const c = catOf(e.target.value); setRForm((p) => ({ ...p, cat: e.target.value, sub: c?.sub[0] || "" })); }} style={inp()}>{cats.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.name}</option>))}</select></div>
          <div style={{ marginBottom: 13 }}><div style={fieldLbl}>하위 카테고리</div><select value={rForm.sub} onChange={(e) => setRForm((p) => ({ ...p, sub: e.target.value }))} style={inp()}><option value="">선택 안함</option>{(catOf(rForm.cat)?.sub || []).map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
          <div style={{ marginBottom: 18 }}><div style={fieldLbl}>네이버 지도 링크</div><input style={inp()} placeholder="https://naver.me/..." value={rForm.mapUrl} onChange={(e) => setRForm((p) => ({ ...p, mapUrl: e.target.value }))} /><div style={{ fontSize: 11.5, color: C.muted, marginTop: 5 }}>네이버 지도 앱 → 가게 검색 → 공유 → 링크 복사</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveRest} style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: R, fontWeight: 600, fontSize: 13.5, cursor: "pointer", background: C.ink, color: "#fff" }}>{modal === "addRest" ? "추가하기" : "저장하기"}</button>
            <button onClick={() => { setModal(null); setMd(null); }} style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: R, fontSize: 13.5, cursor: "pointer", background: C.bg, color: C.muted }}>취소</button>
          </div>
        </Modal>
      )}

      {modal === "delRest" && md && (
        <Modal title="맛집 삭제" onClose={() => { setModal(null); setMd(null); }} width={360}>
          <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, marginBottom: 22 }}><strong style={{ fontWeight: 600 }}>{md.name}</strong>을(를) 삭제할까요?<br /><span style={{ color: C.muted, fontSize: 13 }}>휴지통으로 임시 보관되며, 언제든 복구할 수 있어요.</span></p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => delRest(md.id)} style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: R, fontWeight: 600, fontSize: 13.5, cursor: "pointer", background: "#ff4040", color: "#fff" }}>휴지통으로 이동</button>
            <button onClick={() => { setModal(null); setMd(null); }} style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: R, fontSize: 13.5, cursor: "pointer", background: C.bg, color: C.muted }}>취소</button>
          </div>
        </Modal>
      )}
    </div>
  );
}