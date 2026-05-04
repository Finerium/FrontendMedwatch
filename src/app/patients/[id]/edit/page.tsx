"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/patients/${params.id}`);
  }, [params.id, router]);
  return <p className="text-slate-500">Redirecting...</p>;
}
