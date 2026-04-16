import { NextRequest, NextResponse } from "next/server";

const LOSTARK_API = "https://developer-lostark.game.onstove.com";

export async function GET(req: NextRequest) {
  const charName = req.nextUrl.searchParams.get("charName");
  if (!charName) return NextResponse.json({ error: "캐릭터명 없음" }, { status: 400 });

  try {
    const res = await fetch(
      `${LOSTARK_API}/armories/characters/${encodeURIComponent(charName)}/profiles`,
      {
        headers: {
          Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
    }

    const profile = await res.json();

    return NextResponse.json({
      charName:  profile.CharacterName,
      className: profile.CharacterClassName,
      ilvl:      profile.ItemAvgLevel,
    });
  } catch (e) {
    console.error("API 오류:", e);
    return NextResponse.json({ error: "API 오류" }, { status: 500 });
  }
}