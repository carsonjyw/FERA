import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* <SignIn /> reads the URL, so it needs a Suspense boundary under cacheComponents */}
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
