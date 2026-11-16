import { UpdatePasswordForm } from "@/components/admin/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-[24rem]">
        <p className="font-display text-[1.2rem] italic text-burgundy">Gallery dashboard</p>
        <h1 className="mt-2 font-display text-[2.6rem] leading-none font-light text-ink">Choose a new password</h1>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
