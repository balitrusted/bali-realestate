interface ArchivedListingsDividerProps {
  hasAvailableListings: boolean;
}

export default function ArchivedListingsDivider({ hasAvailableListings }: ArchivedListingsDividerProps) {
  return (
    <div className="mt-10 mb-5 border-t-2 border-rose-200 pt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {hasAvailableListings ? "Archived listings" : "Only archived listings match"}
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            {hasAvailableListings
              ? "These properties are currently unavailable. Open a listing to request an alert if it returns."
              : "No currently available listings match your filters. Open an archived listing to request an alert."}
          </p>
        </div>
        <span className="w-fit rounded-full bg-rose-700 px-3 py-1 text-xs font-semibold text-white">
          Unavailable now
        </span>
      </div>
    </div>
  );
}
