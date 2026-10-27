import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* <SignUp /> reads the URL, so it needs a Suspense boundary under cacheComponents */}
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
