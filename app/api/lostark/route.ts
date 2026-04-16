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
          Authorization: `Bearer ${process.env.LOSTARK_API_KEY}`,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    const data = await res.json();

    // ✅ 아이템 레벨
    const ilvl = data.ItemAvgLevel?.replace(/,/g, "") ?? "";

    // ✅ 전투력 (Stats에서 추출)
    let combatPower = "";

    if (Array.isArray(data.Stats)) {
      const stat = data.Stats.find((s: any) => s.Type === "공격력");
      if (stat) {
        combatPower = stat.Value?.replace(/,/g, "") ?? "";
      }
    }

    return NextResponse.json({
      charName: data.CharacterName,
      className: data.CharacterClassName,
      ilvl,
      combatPower,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}