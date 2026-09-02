"use client";

import React, { useEffect } from "react";
import { globalEventClient } from "@/lib/gateway/events";

export default function GatewayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    globalEventClient.connect();
    return () => {
      // Disconnect on full unmount if desired
    };
  }, []);

  return <>{children}</>;
}
