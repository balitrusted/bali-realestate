import Link from "next/link";
import { redirect } from "next/navigation";
import { removeNotifyRequest } from "@/lib/notifyRequestsData";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type NotifyUnsubscribePageProps = {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
};

export default async function NotifyUnsubscribePage({ searchParams }: NotifyUnsubscribePageProps) {
  const { token, done, error } = await searchParams;
  const unsubscribeToken = token ?? "";
  const validToken = UUID_PATTERN.test(unsubscribeToken);

  async function confirmUnsubscribe() {
    "use server";

    if (!UUID_PATTERN.test(unsubscribeToken)) {
      redirect("/unsubscribe/notify?error=invalid");
    }

    try {
      await removeNotifyRequest(unsubscribeToken);
    } catch (unsubscribeError) {
      console.error("Notify unsubscribe failed:", unsubscribeError);
      redirect("/unsubscribe/notify?error=failed");
    }

    redirect("/unsubscribe/notify?done=1");
  }

  return (
    <main className="min-h-[60vh] bg-gray-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {done === "1" ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900">You are unsubscribed</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              You will no longer receive updates for this listing.
            </p>
            <Link href="/" className="mt-6 inline-block text-sm font-medium text-gray-800 underline underline-offset-2">
              Back to Balitrusted
            </Link>
          </>
        ) : error || !validToken ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900">This unsubscribe link is invalid</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              The link may have expired or already been used. Your subscription has not been changed.
            </p>
            <Link href="/" className="mt-6 inline-block text-sm font-medium text-gray-800 underline underline-offset-2">
              Back to Balitrusted
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase text-rose-700">Villa updates</p>
            <h1 className="mt-2 text-xl font-semibold text-gray-900">Unsubscribe from villa alerts?</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Confirm below to stop update emails for the listing you subscribed to.
            </p>
            <form action={confirmUnsubscribe} className="mt-6">
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Confirm unsubscribe
              </button>
            </form>
            <Link href="/" className="mt-4 inline-block text-sm text-gray-600 underline underline-offset-2">
              Keep subscription and return to Balitrusted
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
