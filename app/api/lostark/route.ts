import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const charName = searchParams.get("charName");

  if (!charName) {
    return NextResponse.json({ error: "charName 필요" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(charName)}/profiles`,
      {
        headers: {
          accept: "application/json",
          authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Lostark API 실패:", res.status, text);
      return NextResponse.json({ error: "조회 실패" }, { status: res.status });
    }

    const data = await res.json();

    const itemLevel = data?.ItemAvgLevel ? String(data.ItemAvgLevel).replace(/,/g, "") : "";
    const combatPower = data?.CombatPower ? String(data.CombatPower).replace(/,/g, "") : "";

    return NextResponse.json({
      charName: data?.CharacterName ?? "",
      className: data?.CharacterClassName ?? "",
      itemLevel,
      combatPower,
    });
  } catch (error) {
    console.error("lostark api error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}