"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PropertyType, MainArea } from "@/types/property";
import { areas } from "@/types/areas";

// Action: what we do. Subject: the thing. URL type = action + subject.
type Action = "Rent" | "Buy";
type Subject = "Villas" | "Land" | "Business";

const actionByType: Record<PropertyType, Action> = {
  rent: "Rent",
  sale: "Buy",
  land: "Buy",
  business: "Buy",
};

const subjectByType: Record<PropertyType, Subject> = {
  rent: "Villas",
  sale: "Villas",
  land: "Land",
  business: "Business",
};

function typeFromActionSubject(action: Action, subject: Subject): PropertyType {
  if (action === "Rent") return "rent"; // only Villas for rent
  if (subject === "Villas") return "sale";
  if (subject === "Land") return "land";
  return "business";
}

const SUBJECTS_FOR_RENT: Subject[] = ["Villas"];
const SUBJECTS_FOR_BUY: Subject[] = ["Villas", "Land", "Business"];

interface PropertyHeaderTitleProps {
  type: PropertyType;
  currentArea: MainArea;
  variant?: "hero" | "default";
  className?: string;
}

export default function PropertyHeaderTitle({
  type,
  currentArea,
  variant = "default",
  className = "",
}: PropertyHeaderTitleProps) {
  const router = useRouter();
  const [actionOpen, setActionOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setActionOpen(false);
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) setSubjectOpen(false);
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setAreaOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const action = actionByType[type];
  const subject = subjectByType[type];
  const subjectOptions = action === "Rent" ? SUBJECTS_FOR_RENT : SUBJECTS_FOR_BUY;
  const areaInfo = areas[currentArea];
  const isHero = variant === "hero";

  const textClass = isHero ? "text-white" : "text-gray-900";
  const triggerClass = isHero
    ? "text-white border-white/80 hover:bg-white/15"
    : "text-gray-900 border-gray-700 hover:bg-gray-100";
  const dropdownClass = isHero
    ? "bg-gray-900/95 border-white/20 text-white"
    : "bg-white border-gray-200 text-gray-900 shadow-lg";

  const handleSelectAction = (newAction: Action) => {
    setActionOpen(false);
    const newSubject = newAction === "Rent" ? "Villas" : subject === "Villas" || subject === "Land" || subject === "Business" ? subject : "Villas";
    const newType = typeFromActionSubject(newAction, newSubject);
    router.push(`/properties/${newType}/${currentArea}`);
  };

  const handleSelectSubject = (newSubject: Subject) => {
    setSubjectOpen(false);
    const newType = typeFromActionSubject(action, newSubject);
    router.push(`/properties/${newType}/${currentArea}`);
  };

  const handleSelectArea = (areaId: MainArea) => {
    setAreaOpen(false);
    router.push(`/properties/${type}/${areaId}`);
  };

  return (
    <span className={className}>
      {/* Action: Rent | Buy */}
      <span className="relative inline-block" ref={actionRef}>
        <button
          type="button"
          onClick={() => {
            setActionOpen((o) => !o);
            setSubjectOpen(false);
            setAreaOpen(false);
          }}
          className={`
            inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1 rounded
            border-b-2 border-dashed font-semibold cursor-pointer transition-colors
            ${textClass} ${triggerClass}
          `}
          aria-expanded={actionOpen}
          aria-haspopup="listbox"
          aria-label={`Action: ${action}. Click to change.`}
        >
          {action}
          <svg className={`w-4 h-4 ml-0.5 transition-transform ${actionOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {actionOpen && (
          <ul role="listbox" className={`absolute left-0 top-full mt-1 py-1 min-w-[100px] rounded-md border z-50 ${dropdownClass}`}>
            {(["Rent", "Buy"] as const).map((a) => (
              <li key={a} role="option" aria-selected={a === action}>
                <button type="button" onClick={() => handleSelectAction(a)} className={`w-full text-left px-4 py-2 text-sm ${isHero ? "hover:bg-white/15" : "hover:bg-gray-100"} ${a === action ? "font-semibold" : ""}`}>
                  {a}
                </button>
              </li>
            ))}
          </ul>
        )}
      </span>{" "}
      {/* Subject: Villas | Land | Business */}
      <span className="relative inline-block" ref={subjectRef}>
        <button
          type="button"
          onClick={() => {
            setSubjectOpen((o) => !o);
            setActionOpen(false);
            setAreaOpen(false);
          }}
          className={`
            inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1 rounded
            border-b-2 border-dashed font-semibold cursor-pointer transition-colors
            ${textClass} ${triggerClass}
          `}
          aria-expanded={subjectOpen}
          aria-haspopup="listbox"
          aria-label={`Subject: ${subject}. Click to change.`}
        >
          {subject}
          <svg className={`w-4 h-4 ml-0.5 transition-transform ${subjectOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {subjectOpen && (
          <ul role="listbox" className={`absolute left-0 top-full mt-1 py-1 min-w-[140px] rounded-md border z-50 ${dropdownClass}`}>
            {subjectOptions.map((s) => (
              <li key={s} role="option" aria-selected={s === subject}>
                <button type="button" onClick={() => handleSelectSubject(s)} className={`w-full text-left px-4 py-2 text-sm ${isHero ? "hover:bg-white/15" : "hover:bg-gray-100"} ${s === subject ? "font-semibold" : ""}`}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </span>{" "}
      in{" "}
      <span className="relative inline-block" ref={areaRef}>
        <button
          type="button"
          onClick={() => {
            setAreaOpen((o) => !o);
            setActionOpen(false);
            setSubjectOpen(false);
          }}
          className={`
            inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1 rounded
            border-b-2 border-dashed font-semibold
            cursor-pointer transition-colors
            ${textClass} ${triggerClass}
          `}
          aria-expanded={areaOpen}
          aria-haspopup="listbox"
          aria-label={`Area: ${areaInfo.nameEn}. Click to change.`}
        >
          {areaInfo.nameEn}
          <svg
            className={`w-4 h-4 ml-0.5 transition-transform ${areaOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {areaOpen && (
          <ul
            role="listbox"
            className={`
              absolute left-0 top-full mt-1 py-1 min-w-[200px] rounded-md border z-50
              ${dropdownClass}
            `}
          >
            {(Object.keys(areas) as MainArea[]).map((areaId) => {
              const info = areas[areaId];
              const isCurrent = areaId === currentArea;
              return (
                <li key={areaId} role="option" aria-selected={isCurrent}>
                  <button
                    type="button"
                    onClick={() => handleSelectArea(areaId)}
                    className={`
                      w-full text-left px-4 py-2 text-sm
                      hover:bg-black/10
                      ${isHero ? "hover:bg-white/15" : "hover:bg-gray-100"}
                      ${isCurrent ? "font-semibold" : ""}
                    `}
                  >
                    {info.nameEn}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </span>
    </span>
  );
}
