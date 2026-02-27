"use client";

import { useEffect } from "react";

interface ArticleViewTrackerProps {
  articleId: string;
}

export default function ArticleViewTracker({ articleId }: ArticleViewTrackerProps) {
  useEffect(() => {
    // Track view when article is loaded (client-side only)
    fetch("/api/articles/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ articleId }),
    }).catch(err => {
      // Silently fail if view tracking fails
      console.error("Failed to track view:", err);
    });
  }, [articleId]);

  return null;
}
