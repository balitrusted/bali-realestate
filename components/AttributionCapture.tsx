"use client";

import { useEffect } from "react";
import { captureFirstTouchAttribution } from "@/lib/attributionClient";

export default function AttributionCapture() {
  useEffect(() => {
    captureFirstTouchAttribution();
  }, []);

  return null;
}
