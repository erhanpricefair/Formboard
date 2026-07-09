import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", formData);
        }}
        className="flex flex-col gap-3"
      >
        <p className="text-sm font-medium text-neutral-500">Partner / Admin</p>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-white dark:bg-white dark:text-neutral-900"
        >
          Sign in
        </button>
      </form>

      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", formData);
        }}
        className="flex flex-col gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
      >
        <p className="text-sm font-medium text-neutral-500">Consumer magic link</p>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        >
          Send magic link
        </button>
      </form>
    </main>
  );
}
