import { NextRequest, NextResponse } from "next/server";
import { callGeminiVisionJSON } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const beforeImage = formData.get("before_image") as File;
    const afterImage = formData.get("after_image") as File | null;
    const volume_ordered = Number(formData.get("volume_ordered")) || 2000;
    const tank_capacity = Number(formData.get("tank_capacity")) || 5000;

    console.log('CV scan — volume_ordered:', volume_ordered, 'tank_capacity:', tank_capacity, 'beforeImage:', !!beforeImage, 'afterImage:', !!afterImage);

    if (!beforeImage) {
      return NextResponse.json(
        { error: "before_image is required" },
        { status: 400 },
      );
    }

    const beforeBase64 = Buffer.from(await beforeImage.arrayBuffer()).toString(
      "base64",
    );

    const beforePrompt = `This is a top-down photo through the hatch of a water tanker before delivery.
Estimate what percentage of the tank is filled with water.
Return ONLY valid JSON: { "fill_percent": number between 0 and 100, "confidence": "low" | "medium" | "high" }`;

    const beforeResult = await callGeminiVisionJSON<{
      fill_percent: number;
      confidence: string;
    }>(beforePrompt, beforeBase64, beforeImage.type || "image/jpeg");

    if (afterImage) {
      const afterBase64 = Buffer.from(await afterImage.arrayBuffer()).toString(
        "base64",
      );

      const afterPrompt = `This is a top-down photo through the hatch of a water tanker after delivery.
Estimate what percentage of the tank is filled with water.
Return ONLY valid JSON: { "fill_percent": number between 0 and 100, "confidence": "low" | "medium" | "high" }`;

      const afterResult = await callGeminiVisionJSON<{
        fill_percent: number;
        confidence: string;
      }>(afterPrompt, afterBase64, afterImage.type || "image/jpeg");

      const percentUsed =
        (beforeResult.fill_percent - afterResult.fill_percent) / 100;
      const estimated_liters = Math.round(percentUsed * tank_capacity);
      const discrepancy = volume_ordered - estimated_liters;
      const discrepancy_percent = (discrepancy / volume_ordered) * 100;

      return NextResponse.json({
        before_fill_percent: beforeResult.fill_percent,
        after_fill_percent: afterResult.fill_percent,
        estimated_liters,
        volume_ordered,
        discrepancy_liters: discrepancy,
        discrepancy_percent,
        confidence:
          beforeResult.confidence === "high" &&
          afterResult.confidence === "high"
            ? "high"
            : "medium",
        verdict:
          discrepancy_percent > 10
            ? "short"
            : discrepancy_percent < -10
              ? "excess"
              : "confirmed",
      });
    }

    const estimated_liters = Math.round(
      (beforeResult.fill_percent / 100) * tank_capacity,
    );
    const discrepancy = volume_ordered - estimated_liters;
    const discrepancy_percent = (discrepancy / volume_ordered) * 100;

    return NextResponse.json({
      before_fill_percent: beforeResult.fill_percent,
      estimated_liters,
      volume_ordered,
      discrepancy_liters: discrepancy,
      discrepancy_percent,
      confidence: beforeResult.confidence,
      verdict: "confirmed",
      note: "Single photo — fill level estimated. Use two photos (before/after) for accurate volume verification.",
    });
  } catch (error) {
    console.error('cv-volume error:', error);
    const e = error as { name?: string; message?: string; status?: number; statusCode?: number };
    console.error('cv-volume error name:', e?.name);
    console.error('cv-volume error message:', e?.message);
    console.error('cv-volume error status:', e?.status || e?.statusCode);
    return NextResponse.json(
      { error: 'CV volume analysis failed', detail: String(error) },
      { status: 500 }
    );
  }
}
