import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved",
  description: "Your saved properties and comparison list.",
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
