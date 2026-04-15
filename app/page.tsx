"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DiscordSDK } from "@discord/embedded-app-sdk";

const discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);

const RAIDS: Record<string, { name: string; ilvl: number }[]> = {
  "어비스": [
    { name: "지평의 성당 (3단계)", ilvl: 1750 },
    { name: "지평의 성당 (2단계)", ilvl: 1720 },
    { name: "지평의 성당 (1단계)", ilvl: 1700 },
  ],
  "그림자": [
    { name: "세르카 (나이트메어)", ilvl: 1740 },
    { name: "세르카 (하드)", ilvl: 1730 },
    { name: "세르카 (노말)", ilvl: 1710 },
  ],
  "카제로스": [
    { name: "종막 (하드)", ilvl: 1740 },
    { name: "종막 (노말)", ilvl: 1720 },
    { name: "4막 (하드)", ilvl: 1720 },
    { name: "4막 (노말)", ilvl: 1700 },
    { name: "3막 (하드)", ilvl: 1700 },
    { name: "3막 (노말)", ilvl: 1680 },
    { name: "2막 (하드)", ilvl: 1680 },
    { name: "2막 (노말)", ilvl: 1660 },
    { name: "1막 (하드)", ilvl: 1660 },
    { name: "1막 (노말)", ilvl: 1640 },
    { name: "서막 (하드)", ilvl: 1640 },
    { name: "서막 (노말)", ilvl: 1620 },
  ],
  "에픽": [{ name: "베히모스", ilvl: 1640 }],
  "군단장": [
    { name: "카멘 (하드)", ilvl: 1630 },
    { name: "카멘 (노말)", ilvl: 1610 },
    { name: "일리아칸 (하드)", ilvl: 1600 },
    { name: "일리아칸 (노말)", ilvl: 1580 },
    { name: "아브렐슈드 (하드)", ilvl: 1520 },
    { name: "아브렐슈드 (노말)", ilvl: 1490 },
    { name: "쿠크세이튼", ilvl: 1475 },
    { name: "비아키스 (하드)", ilvl: 1460 },
    { name: "비아키스 (노말)", ilvl: 1430 },
    { name: "발탄 (하드)", ilvl: 1445 },
    { name: "발탄 (노말)", ilvl: 1415 },
  ],
};

const CLASSES = [
  "버서커", "디스트로이어", "워로드", "홀리나이트", "슬레이어", "발키리",
  "배틀마스터", "인파이터", "기공사", "창술사", "스트라이커", "브레이커",
  "건슬링어", "데빌헌터", "블래스터", "스카우터", "호크아이",
  "소서리스", "아르카나", "서머너", "바드",
  "블레이드", "데모닉", "리퍼", "소울이터",
  "도화가", "기상술사", "환수사", "가디언나이트",
];

const RAID_ILVL: Record<string, number> = {};
const RAID_CAT: Record<string, string> = {};
Object.entries(RAIDS).forEach(([cat, list]) =>
  list.forEach((r) => { RAID_ILVL[r.name] = r.ilvl; RAID_CAT[r.name] = cat; })
);

const CAT_COLOR: Record<string, string> = {
  "어비스": "#BA7517", "그림자": "#993556", "카제로스": "#7F77DD",
  "에픽": "#D4537E", "군단장": "#1D9E75",
};
const CAT_BG: Record<string, string> = {
  "어비스": "#FAEEDA", "그림자": "#FBEAF0", "카제로스": "#EEEDFE",
  "에픽": "#FBEAF0", "군단장": "#E1F5EE",
};

const ADMIN_NAME = "도라지파티";

interface Person {
  accountName: string; charName: string; role: string;
  className?: string; power?: string;
}
interface Group { members: Person[]; applicants: Person[]; }
interface Party {
  id: number; raid: string; masterId: string; masterName: string;
  partyCount: number; date: string; groups: Group[]; memo: string;
}
interface MyStatus { status: string; gi: number; }

function getMyStatus(groups: Group[], accountName: string): MyStatus {
  for (let gi = 0; gi < groups.length; gi++) {
    if (groups[gi].members.some((m) => m.accountName === accountName)) return { status: "member", gi };
    if (groups[gi].applicants.some((a) => a.accountName === accountName)) return { status: "applicant", gi };
  }
  return { status: "none", gi: -1 };
}

function Badge({ cat }: { cat: string }) {
  return (
    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: CAT_BG[cat], color: CAT_COLOR[cat], fontWeight: 500 }}>
      {cat}
    </span>
  );
}

function ApplyPopup({ role, onConfirm, onClose }: {
  role: string;
  onConfirm: (charName: string, className: string, power: string) => void;
  onClose: () => void;
}) {
  const [charName, setCharName] = useState("");
  const [className, setClassName] = useState("");
  const [power, setPower] = useState("");
  const canSubmit = charName.trim() && className;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 300, border: "0.5px solid #ddd" }}>
        <p style={{ margin: "0 0 6px", fontWeight: 500, fontSize: 15 }}>신청 정보 입력</p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>{role} 슬롯에 참여할 정보를 입력하세요</p>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: "#888" }}>캐릭터명</label>
          <input autoFocus value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="캐릭터명"
            style={{ width: "100%", fontSize: 14, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box", marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: "#888" }}>직업</label>
          <select value={className} onChange={(e) => setClassName(e.target.value)}
            style={{ width: "100%", fontSize: 14, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box", marginTop: 4 }}>
            <option value="">직업 선택</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#888" }}>전투력 (선택)</label>
          <input value={power} onChange={(e) => setPower(e.target.value)} placeholder="예: 6500" type="number"
            style={{ width: "100%", fontSize: 14, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box", marginTop: 4 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "0.5px solid #ccc", background: "#f5f5f5", fontSize: 14, cursor: "pointer" }}>취소</button>
          <button onClick={() => { if (canSubmit) onConfirm(charName.trim(), className, power); }} disabled={!canSubmit}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: canSubmit ? "#7F77DD" : "#eee", color: canSubmit ? "#fff" : "#aaa", fontSize: 14, cursor: canSubmit ? "pointer" : "default", fontWeight: 500 }}>
            신청
          </button>
        </div>
      </div>
    </div>
  );
}

function Slots({ group, gi, canApply, accountName, onApply, onCancel, onLeave }: {
  group: Group; gi: number; canApply: boolean; accountName: string;
  onApply: (gi: number, role: string) => void;
  onCancel: (gi: number) => void;
  onLeave: (gi: number) => void;
}) {
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const supportMember = group.members.find((m) => m.role === "서폿") || null;
  const supportApplicant = !supportMember ? (group.applicants.find((a) => a.role === "서폿") || null) : null;
  const dealerMembers = group.members.filter((m) => m.role === "딜러");
  const dealerApplicants = group.applicants.filter((a) => a.role === "딜러");
  const dealerSlots = [0, 1, 2].map((i) => {
    if (dealerMembers[i]) return { person: dealerMembers[i], pending: false };
    const ai = i - dealerMembers.length;
    if (ai >= 0 && dealerApplicants[ai]) return { person: dealerApplicants[ai], pending: true };
    return { person: null, pending: false };
  });
  const slots = [
    { role: "서폿", person: supportMember || supportApplicant || null, pending: !supportMember && !!supportApplicant },
    ...dealerSlots.map((d) => ({ role: "딜러", ...d })),
  ];

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
      {slots.map((s, i) => {
        const isSupport = s.role === "서폿";
        const isEmpty = !s.person;
        const isMe = !isEmpty && s.person!.accountName === accountName;
        const isConfirming = cancelTarget === i;
        const bg = isConfirming ? "#FCEBEB"
          : s.pending ? (isSupport ? "#F3F0FD" : "#F5F5F2")
          : !isEmpty ? (isSupport ? "#EEEDFE" : "#F1EFE8")
          : "#f9f9f9";
        const border = isConfirming ? "#E24B4A" : isSupport ? "#7F77DD" : "#888780";

        function handleClick() {
          if (isEmpty && canApply) { onApply(gi, s.role); return; }
          if (isMe) {
            if (isConfirming) { setCancelTarget(null); if (s.pending) onCancel(gi); else onLeave(gi); }
            else setCancelTarget(i);
          } else setCancelTarget(null);
        }

        return (
          <div key={i} onClick={handleClick}
            style={{ width: 54, height: 54, borderRadius: 10, flexShrink: 0, border: `1.5px ${isEmpty ? "dashed" : "solid"} ${border}`, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: (isEmpty && canApply) || isMe ? "pointer" : "default", opacity: isEmpty && !canApply ? 0.4 : 1 }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: isConfirming ? "#E24B4A" : isSupport ? "#7F77DD" : "#888780" }}>
              {isConfirming ? "취소?" : s.role}
            </span>
            {!isEmpty ? (
              <>
                <span style={{ fontSize: s.person!.charName.length > 6 ? 8 : s.person!.charName.length > 4 ? 9 : 11, fontWeight: 500, color: isConfirming ? "#A32D2D" : isSupport ? "#534AB7" : "#222", marginTop: 1, lineHeight: 1.3, textAlign: "center", wordBreak: "break-all", width: "100%", padding: "0 3px", boxSizing: "border-box" }}>
                  {s.person!.charName}
                </span>
                {s.pending && <span style={{ fontSize: 8, color: isConfirming ? "#E24B4A" : isSupport ? "#7F77DD" : "#888", opacity: 0.8 }}>대기</span>}
              </>
            ) : <span style={{ fontSize: 20, opacity: 0.2, lineHeight: 1 }}>+</span>}
          </div>
        );
      })}
    </div>
  );
}

function MemoBox({ partyId, memo, isMaster, onSave }: {
  partyId: number; memo: string; isMaster: boolean;
  onSave: (partyId: number, memo: string) => void;
}) {
  const [localMemo, setLocalMemo] = useState(memo);

  useEffect(() => { setLocalMemo(memo); }, [memo]);

  useEffect(() => {
    if (localMemo === memo) return;
    const timer = setTimeout(() => { onSave(partyId, localMemo); }, 1000);
    return () => clearTimeout(timer);
  }, [localMemo]);

  return (
    <div style={{ marginTop: 12, padding: "12px 14px", background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12 }}>
      <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888", fontWeight: 500 }}>메모</p>
      {isMaster ? (
        <>
          <textarea
            value={localMemo}
            onChange={(e) => { if (e.target.value.length <= 100) setLocalMemo(e.target.value); }}
            placeholder="파티에 대한 메모를 입력하세요 (최대 100자)"
            maxLength={100}
            style={{ width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box", resize: "none", height: 72, fontFamily: "sans-serif" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa", textAlign: "right" }}>
            {localMemo.length}/100
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: memo ? "#333" : "#aaa", lineHeight: 1.6 }}>
          {memo || "메모 없음"}
        </p>
      )}
    </div>
  );
}

function GroupCard({ group, gi, isMaster, myStatus, accountName, onApply, onCancel, onLeave, onAccept, onReject }: {
  group: Group; gi: number; isMaster: boolean; myStatus: MyStatus; accountName: string;
  onApply: (gi: number, role: string) => void;
  onCancel: (gi: number) => void;
  onLeave: (gi: number) => void;
  onAccept: (gi: number, ai: number) => void;
  onReject: (gi: number, ai: number) => void;
}) {
  const canApply = myStatus.status === "none";
  const total = group.members.length + group.applicants.length;
  const allPersons = [
    ...group.members,
    ...group.applicants.filter(a => group.members.every(m => m.accountName !== a.accountName)),
  ];

  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{gi + 1}파티</span>
        <span style={{ fontSize: 12, color: "#888" }}>{total}/4</span>
      </div>
      <Slots group={group} gi={gi} canApply={canApply} accountName={accountName} onApply={onApply} onCancel={onCancel} onLeave={onLeave} />

      {allPersons.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {allPersons.map((p, i) => {
            const isPending = group.applicants.some(a => a.accountName === p.accountName);
            const isSupport = p.role === "서폿";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: isPending ? "#FAFAFA" : isSupport ? "#F3F0FD" : "#F5F9F5", border: `0.5px solid ${isPending ? "#eee" : isSupport ? "#C5BFEF" : "#B8DFC0"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 500, background: isSupport ? "#7F77DD" : "#1D9E75", color: "#fff" }}>{p.role}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{p.charName}</span>
                    <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>({p.accountName})</span>
                    {isPending && <span style={{ fontSize: 10, color: "#BA7517", marginLeft: 4 }}>대기중</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {p.className && <span style={{ fontSize: 11, color: "#666" }}>{p.className}</span>}
                  {p.power && <span style={{ fontSize: 11, color: "#7F77DD", fontWeight: 500 }}>{Number(p.power).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isMaster && group.applicants.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "0.5px solid #eee", paddingTop: 8 }}>
          <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px" }}>신청자 관리</p>
          {group.applicants.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>
                {a.charName}
                <span style={{ color: "#aaa" }}> ({a.accountName})</span>
                <span style={{ color: a.role === "서폿" ? "#534AB7" : "#3B6D11" }}> · {a.role}</span>
                {a.className && <span style={{ color: "#888" }}> · {a.className}</span>}
                {a.power && <span style={{ color: "#888" }}> · {a.power}</span>}
              </span>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => onAccept(gi, i)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "0.5px solid #1D9E75", background: "#E1F5EE", color: "#0F6E56", cursor: "pointer" }}>수락</button>
                <button onClick={() => onReject(gi, i)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "0.5px solid #E24B4A", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer" }}>거절</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"list" | "create" | "detail">("list");
  const [parties, setParties] = useState<Party[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [myName, setMyName] = useState("모험가");
  const [myOnly, setMyOnly] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myId] = useState("user_me");
  const [form, setForm] = useState({ raid: "지평의 성당 (3단계)", partyCount: 2, date: "", charName: "", className: "", power: "", role: "서폿" });
  const [toast, setToast] = useState("");
  const [popup, setPopup] = useState<{ partyId: number; gi: number; role: string } | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("loa_account_name");
    if (savedName) setMyName(savedName);
  }, []);

  useEffect(() => {
    fetch("/api/check-admin")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadParties() {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setParties(data.map((p) => ({
          id: p.id, raid: p.raid, masterId: p.master_id, masterName: p.master_name,
          partyCount: p.party_count, date: p.date || "", groups: p.groups, memo: p.memo || "",
        })));
      }
    }
    loadParties();
    const interval = setInterval(loadParties, 5000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  const detailParty = parties.find((p) => p.id === selected) || null;
  const myStatus: MyStatus = detailParty ? getMyStatus(detailParty.groups, myName) : { status: "none", gi: -1 };

  async function deleteParty(partyId: number) {
    await supabase.from("parties").delete().eq("id", partyId);
    setScreen("list");
    showToast("파티를 삭제했습니다.");
  }

  async function updateDate(partyId: number, date: string) {
    await supabase.from("parties").update({ date }).eq("id", partyId);
  }

  async function updateMemo(partyId: number, memo: string) {
    await supabase.from("parties").update({ memo }).eq("id", partyId);
  }

  function openApplyPopup(partyId: number, gi: number, role: string) {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return;
    const st = getMyStatus(party.groups, myName);
    if (st.status !== "none") { showToast("이미 신청하거나 참여 중입니다!"); return; }
    const g = party.groups[gi];
    if (role === "서폿") {
      const taken = g.members.some((m) => m.role === "서폿") || g.applicants.some((a) => a.role === "서폿");
      if (taken) { showToast("서폿 자리가 찼습니다!"); return; }
    }
    if (role === "딜러") {
      const cnt = g.members.filter((m) => m.role === "딜러").length + g.applicants.filter((a) => a.role === "딜러").length;
      if (cnt >= 3) { showToast("딜러 자리가 찼습니다!"); return; }
    }
    setPopup({ partyId, gi, role });
  }

  async function confirmApply(charName: string, className: string, power: string) {
    if (!popup) return;
    const { partyId, gi, role } = popup;
    setPopup(null);
    const party = parties.find((p) => p.id === partyId);
    if (!party) return;
    const newGroups = party.groups.map((g, i) =>
      i !== gi ? g : { ...g, applicants: [...g.applicants, { accountName: myName, charName, role, className, power }] }
    );
    await supabase.from("parties").update({ groups: newGroups }).eq("id", partyId);
    showToast(`${charName} 신청 완료!`);
  }

  async function cancelApply(partyId: number, gi: number) {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return;
    const newGroups = party.groups.map((g, i) =>
      i !== gi ? g : { ...g, applicants: g.applicants.filter((a) => a.accountName !== myName) }
    );
    await supabase.from("parties").update({ groups: newGroups }).eq("id", partyId);
    showToast("신청을 취소했습니다.");
  }

  async function leave(partyId: number, gi: number) {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return;
    const newGroups = party.groups.map((g, i) =>
      i !== gi ? g : { ...g, members: g.members.filter((m) => m.accountName !== myName) }
    );
    await supabase.from("parties").update({ groups: newGroups }).eq("id", partyId);
    showToast("참여를 취소했습니다.");
  }

  async function accept(partyId: number, gi: number, ai: number) {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return;
    const newGroups = party.groups.map((g, i) => {
      if (i !== gi) return g;
      const app = g.applicants[ai];
      if (app.role === "서폿" && g.members.some((m) => m.role === "서폿")) { showToast("서폿 자리가 찼습니다!"); return g; }
      if (app.role === "딜러" && g.members.filter((m) => m.role === "딜러").length >= 3) { showToast("딜러 자리가 찼습니다!"); return g; }
      return { ...g, members: [...g.members, app], applicants: g.applicants.filter((_, j) => j !== ai) };
    });
    await supabase.from("parties").update({ groups: newGroups }).eq("id", partyId);
  }

  async function reject(partyId: number, gi: number, ai: number) {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return;
    const newGroups = party.groups.map((g, i) =>
      i !== gi ? g : { ...g, applicants: g.applicants.filter((_, j) => j !== ai) }
    );
    await supabase.from("parties").update({ groups: newGroups }).eq("id", partyId);
    showToast("거절했습니다.");
  }

  async function createParty() {
    if (!form.date) { showToast("날짜를 선택해주세요!"); return; }
    if (!form.charName.trim()) { showToast("캐릭터명을 입력해주세요!"); return; }
    if (!form.className) { showToast("직업을 선택해주세요!"); return; }
    const newParty = {
      id: Date.now(), raid: form.raid, master_id: myName, master_name: myName,
      party_count: form.partyCount, date: form.date, memo: "",
      groups: Array(form.partyCount).fill(null).map((_, i) => ({
        members: i === 0 ? [{ accountName: myName, charName: form.charName.trim(), role: form.role, className: form.className, power: form.power }] : [],
        applicants: [],
      })),
    };
    const { error } = await supabase.from("parties").insert(newParty);
    if (error) { showToast("파티 생성 실패!"); return; }
    showToast("파티가 개설되었습니다!");
    setScreen("list");
  }

  const filteredParties = myOnly
    ? parties.filter((p) =>
        p.masterName === myName ||
        p.groups.some((g) =>
          g.members.some((m) => m.accountName === myName) ||
          g.applicants.some((a) => a.accountName === myName)
        )
      )
    : parties;

  return (
    <div style={{ width: "100%", boxSizing: "border-box", paddingBottom: 80, fontFamily: "sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2C2C2A", color: "#fff", padding: "8px 20px", borderRadius: 20, fontSize: 13, zIndex: 200, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
      {popup && <ApplyPopup role={popup.role} onConfirm={confirmApply} onClose={() => setPopup(null)} />}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 8px" }}>
        {screen !== "list" && (
          <button onClick={() => setScreen("list")} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
        )}
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
          {screen === "list" ? "로아 레이드 모집" : screen === "create" ? "파티 개설" : detailParty?.raid}
        </h2>
      </div>

      {screen === "list" && (
        <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#888" }}>내 계정명</span>
          <input value={myName} onChange={(e) => { setMyName(e.target.value); localStorage.setItem("loa_account_name", e.target.value); }}
            style={{ fontSize: 13, padding: "4px 8px", borderRadius: 8, border: "0.5px solid #ccc", width: 110 }} />
          <button onClick={() => setMyOnly((v) => !v)}
            style={{ marginLeft: "auto", fontSize: 12, padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${myOnly ? "#7F77DD" : "#ccc"}`, background: myOnly ? "#EEEDFE" : "#f9f9f9", color: myOnly ? "#534AB7" : "#888", cursor: "pointer", fontWeight: myOnly ? 500 : 400, whiteSpace: "nowrap" }}>
            내 파티만
          </button>
        </div>
      )}

      {screen === "list" && (
        <div style={{ padding: "0 16px" }}>
          {filteredParties.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
              {myOnly ? "참여 중인 파티가 없습니다." : "모집 중인 파티가 없습니다."}
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {filteredParties.map((p) => {
                const filled = p.groups.reduce((a, g) => a + g.members.length + g.applicants.length, 0);
                const total = p.partyCount * 4;
                return (
                  <div key={p.id} onClick={() => { setSelected(p.id); setScreen("detail"); }}
                    style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, padding: "20px 18px", cursor: "pointer", minHeight: 140 }}>
                    <Badge cat={RAID_CAT[p.raid]} />
                    <p style={{ margin: "6px 0 2px", fontWeight: 500, fontSize: 14 }}>{p.raid}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>방장: {p.masterName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{p.partyCount}파티 · 최소 {RAID_ILVL[p.raid]}</p>
                    {p.date && (
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#333" }}>
                        {new Date(p.date).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: filled === total ? "#E24B4A" : "#1D9E75" }}>{filled}/{total}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{filled === total ? "모집 완료" : "모집 중"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {screen === "create" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 14, padding: 16, maxWidth: 420 }}>
            {/* 내 정보 */}
            <div style={{ marginBottom: 14, padding: "12px 14px", background: "#f9f9f9", borderRadius: 10, border: "0.5px solid #eee" }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500 }}>내 정보</p>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: "#888" }}>계정명</label>
                <input value={myName} disabled
                  style={{ width: "100%", marginTop: 4, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "0.5px solid #ddd", background: "#f0f0f0", color: "#888", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: "#888" }}>역할</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {["서폿", "딜러"].map((r) => (
                    <button key={r} onClick={() => setForm((f) => ({ ...f, role: r }))}
                      style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1.5px solid ${form.role === r ? (r === "서폿" ? "#7F77DD" : "#1D9E75") : "#ddd"}`, background: form.role === r ? (r === "서폿" ? "#EEEDFE" : "#E1F5EE") : "#f9f9f9", color: form.role === r ? (r === "서폿" ? "#534AB7" : "#0F6E56") : "#333", fontWeight: form.role === r ? 500 : 400 }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: "#888" }}>캐릭터명</label>
                <input value={form.charName} onChange={(e) => setForm((f) => ({ ...f, charName: e.target.value }))} placeholder="참여할 캐릭터명"
                  style={{ width: "100%", marginTop: 4, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: "#888" }}>직업</label>
                <select value={form.className} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                  style={{ width: "100%", marginTop: 4, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box" }}>
                  <option value="">직업 선택</option>
                  {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888" }}>전투력 (선택)</label>
                <input value={form.power} onChange={(e) => setForm((f) => ({ ...f, power: e.target.value }))} placeholder="예: 6500" type="number"
                  style={{ width: "100%", marginTop: 4, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: "#888" }}>레이드 선택</label>
              <select value={form.raid} onChange={(e) => setForm((f) => ({ ...f, raid: e.target.value }))}
                style={{ width: "100%", marginTop: 6, fontSize: 14, padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ccc" }}>
                {Object.entries(RAIDS).map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((r) => <option key={r.name} value={r.name}>{r.name} (최소 {r.ilvl})</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "#f9f9f9", borderRadius: 8, border: "0.5px solid #eee", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#888" }}>최소 아이템레벨</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: CAT_COLOR[RAID_CAT[form.raid]] }}>{RAID_ILVL[form.raid]}</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: "#888" }}>날짜 선택</label>
              <input type="datetime-local" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", marginTop: 6, fontSize: 14, padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ccc", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#888" }}>공격대 규모</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {[1, 2, 4].map((n) => (
                  <button key={n} onClick={() => setForm((f) => ({ ...f, partyCount: n }))}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 14, cursor: "pointer", border: `1.5px solid ${form.partyCount === n ? "#7F77DD" : "#ddd"}`, background: form.partyCount === n ? "#EEEDFE" : "#f9f9f9", color: form.partyCount === n ? "#534AB7" : "#333", fontWeight: form.partyCount === n ? 500 : 400 }}>
                    {n}파티 ({n * 4}명)
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createParty}
              style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "#7F77DD", color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
              파티 개설하기
            </button>
          </div>
        </div>
      )}

      {screen === "detail" && detailParty && (
        <div style={{ padding: "0 16px", maxWidth: 420 }}>
          <div style={{ marginBottom: 10 }}>
            <Badge cat={RAID_CAT[detailParty.raid]} />
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#888" }}>
              방장: {detailParty.masterName} · 최소 아이템레벨 {RAID_ILVL[detailParty.raid]}
            </p>
            {detailParty.masterId === myName ? (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>날짜</span>
                <input type="datetime-local" value={detailParty.date || ""} onChange={(e) => updateDate(detailParty.id, e.target.value)}
                  style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, border: "0.5px solid #ccc", flex: 1 }} />
              </div>
            ) : detailParty.date ? (
              <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 500 }}>
                {new Date(detailParty.date).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#aaa" }}>날짜 미정</p>
            )}
          </div>

          {detailParty.groups.map((g, gi) => (
            <GroupCard key={gi} group={g} gi={gi}
              isMaster={detailParty.masterId === myName}
              myStatus={myStatus} accountName={myName}
              onApply={(gi, role) => openApplyPopup(detailParty.id, gi, role)}
              onCancel={(gi) => cancelApply(detailParty.id, gi)}
              onLeave={(gi) => leave(detailParty.id, gi)}
              onAccept={(gi, ai) => accept(detailParty.id, gi, ai)}
              onReject={(gi, ai) => reject(detailParty.id, gi, ai)}
            />
          ))}

          {/* 메모 */}
          <MemoBox
            partyId={detailParty.id}
            memo={detailParty.memo || ""}
            isMaster={detailParty.masterId === myName}
            onSave={updateMemo}
          />

          {(detailParty.masterId === myName || isAdmin) && (
            <button
              onClick={() => { if (confirm("정말 파티를 삭제할까요?")) deleteParty(detailParty.id); }}
              style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "0.5px solid #E24B4A", background: "#FCEBEB", color: "#A32D2D", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 12 }}>
              파티 삭제
            </button>
          )}

          {detailParty.masterId !== myName && myStatus.status === "none" && (
            <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginTop: 8 }}>
              슬롯을 눌러 신청하세요 (보라색 = 서폿 슬롯)
            </p>
          )}
        </div>
      )}

      {screen === "list" && (
        <button onClick={() => setScreen("create")}
          style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#7F77DD", color: "#fff", border: "none", borderRadius: 30, padding: "14px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
          + 파티 개설
        </button>
      )}
    </div>
  );
}