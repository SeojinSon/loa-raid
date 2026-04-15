import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { raid, masterName, partyCount, date } = await req.json();

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;

  const dateStr = date
    ? new Date(date).toLocaleString("ko-KR", {
        month: "long", day: "numeric", weekday: "short",
        hour: "2-digit", minute: "2-digit",
      })
    : "날짜 미정";

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🗡️ 새 레이드 파티 개설!",
        color: 0x7F77DD,
        fields: [
          { name: "레이드", value: raid, inline: true },
          { name: "방장", value: masterName, inline: true },
          { name: "규모", value: `${partyCount}파티 (${partyCount * 4}명)`, inline: true },
          { name: "날짜", value: dateStr, inline: false },
        ],
        footer: { text: "👉 loa-raid-three.vercel.app" },
      }],
    }),
  });

  return NextResponse.json({ ok: true });
}