"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, XCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

const DeviceApprovalContent = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");

  const [isProcessing, setIsProcessing] = useState({ approve: false, deny: false });

  useEffect(() => {
    if (isPending) return;
    if (!data?.session && !data?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/approve?user_code=${userCode}`)}`);
    }
  }, [isPending, data, router, userCode]);

  if (isPending || !data?.session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  const handleApprove = async () => {
    setIsProcessing({ approve: true, deny: false });
    try {
      toast.loading("Approving device...", { id: "loading" });
      await authClient.device.approve({ userCode: userCode! });
      toast.dismiss("loading");
      toast.success("Device approved successfully!", { id: "success" });
      router.push("/account");
    } catch (error) {
      toast.error("Failed to approve device.");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  const handleDeny = async () => {
    setIsProcessing({ approve: false, deny: true });
    try {
      toast.loading("Denying device...", { id: "deny" });
      await authClient.device.deny({ userCode: userCode! });
      toast.dismiss("deny");
      toast.success("Device denied.", { id: "success" });
      router.push("/");
    } catch (error) {
      toast.error("Failed to deny device.");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="w-full max-w-md px-4">
        <div className="space-y-8">
          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 bg-zinc-900/50 backdrop-blur-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-600 bg-zinc-800 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-cyan-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">!</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-zinc-50">Device Authorization</h1>
              <p className="text-sm text-zinc-400">A new device is requesting access to your account</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Authorization Code</p>
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <p className="text-xl font-mono font-bold text-cyan-400 text-center tracking-widest">
                  {userCode || "---"}
                </p>
              </div>
              <p className="text-sm text-zinc-600 text-center">Share this code with the requesting device</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 tracking-wide">ACCOUNT : {data?.user?.email}</p>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <p className="text-sm text-zinc-300">
                  Only approve this request if you initiated it. For security reasons, do not share your authorization code with anyone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleApprove} disabled={isProcessing.approve}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
              {isProcessing.approve ? <><Spinner className="w-4 h-4" /><span>Approving...</span></> : <><CheckCircle className="w-4 h-4" /><span>Approve Device</span></>}
            </Button>
            <Button onClick={handleDeny} disabled={isProcessing.deny}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
              {isProcessing.deny ? <><Spinner className="w-4 h-4" /><span>Denying...</span></> : <><XCircle className="w-4 h-4" /><span>Deny Device</span></>}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px border-t border-dashed border-zinc-700"></div>
            <span className="text-xs text-zinc-600">Choose Wisely</span>
            <div className="flex-1 h-px border-t border-dashed border-zinc-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeviceApprovalPage = () => {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-screen bg-background"><Spinner /></div>}>
      <DeviceApprovalContent />
    </Suspense>
  );
};

export default DeviceApprovalPage;