import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </>
  );
}
