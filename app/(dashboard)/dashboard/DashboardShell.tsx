"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { broadcastLogout } from "@/components/AuthGuard";
import ReconsentModal from "@/components/reconsent-modal";
import { cn } from "@/lib/utils";

// shadcn components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
// Tooltip removed — sidebar always shows labels at 220px width

// lucide icons
import {
  LayoutDashboard,
  Send,
  MessageSquare,
  Lock,
  FileText,
  User,
  Tag,
  FolderOpen,
  SlidersHorizontal,
  Users,
  BarChart3,
  CircleDollarSign,
  Key,
  ScrollText,
  BookOpen,
  Settings,
  Receipt,
  ClipboardList,
  Megaphone,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";
import type { UserData } from "@/lib/types/api-responses";
import { formatThaiDateTimeShort } from "@/lib/format-thai-date";

type SidebarItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  section: "main" | "billing" | "audience" | "manage" | "settings";
};

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "ภาพรวม", href: "/dashboard", section: "main" },
  { icon: Send, label: "ส่ง SMS", href: "/dashboard/send", section: "main" },
  { icon: MessageSquare, label: "ประวัติการส่ง", href: "/dashboard/messages", section: "main" },
  { icon: Lock, label: "บริการ OTP", href: "/dashboard/otp", section: "main" },
  { icon: FileText, label: "เทมเพลต", href: "/dashboard/templates", section: "main" },
  { icon: CircleDollarSign, label: "ซื้อแพ็กเกจ", href: "/dashboard/packages", section: "billing" },
  { icon: Receipt, label: "แพ็กเกจของฉัน", href: "/dashboard/packages/my", section: "billing" },
  { icon: ClipboardList, label: "ประวัติคำสั่งซื้อ", href: "/dashboard/billing/orders", section: "billing" },
  { icon: User, label: "รายชื่อผู้ติดต่อ", href: "/dashboard/contacts", section: "audience" },
  { icon: Tag, label: "แท็ก", href: "/dashboard/tags", section: "audience" },
  { icon: FolderOpen, label: "กลุ่ม", href: "/dashboard/groups", section: "audience" },
  { icon: SlidersHorizontal, label: "ชื่อผู้ส่ง", href: "/dashboard/senders", section: "manage" },
  { icon: Megaphone, label: "แคมเปญ", href: "/dashboard/campaigns", section: "manage" },
  { icon: BarChart3, label: "รายงาน", href: "/dashboard/analytics", section: "manage" },
  { icon: Key, label: "คีย์ API", href: "/dashboard/api-keys", section: "settings" },
  { icon: ScrollText, label: "API Logs", href: "/dashboard/logs", section: "settings" },
  { icon: BookOpen, label: "เอกสาร API", href: "/dashboard/docs", section: "settings" },
  { icon: Settings, label: "ตั้งค่า", href: "/dashboard/settings", section: "settings" },
];

function SidebarLink({ item, isActive }: { item: SidebarItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200",
        isActive
          ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border-l-[3px] border-[var(--accent)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]"
      )}
    >
      <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
      {item.label}
    </Link>
  );
}

export default function DashboardShell({
  user,
  smsRemaining = 0,
  title = "",
  children,
}: {
  user: UserData | null;
  smsRemaining?: number;
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // CMD+K search
  const [cmdkOpen, setCmdkOpen] = useState(false);

  // Collapsible audience group
  const [audienceOpen, setAudienceOpen] = useState(true);

  // Mobile sheet
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Notifications
  type Notif = { id: string; type: string; message: string; createdAt: string; read: boolean };
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifs(d.items ?? []);
        setUnreadCount(d.unreadCount ?? 0);
      })
      .catch(() => {});
  }, []);

  // CMD+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleNotifOpen() {
    if (unreadCount > 0) {
      setUnreadCount(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
    }
  }

  const mainItems = sidebarItems.filter((i) => i.section === "main");
  const billingItems = sidebarItems.filter((i) => i.section === "billing");
  const audienceItems = sidebarItems.filter((i) => i.section === "audience");
  const manageItems = sidebarItems.filter((i) => i.section === "manage");
  const settingsItems = sidebarItems.filter((i) => i.section === "settings");

  function isItemActive(item: SidebarItem) {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-[220px] shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-base)] flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 h-14 border-b border-[var(--border-default)] group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">SMSOK</span>
        </Link>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3 px-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">
            เมนูหลัก
          </div>
          <nav className="space-y-0.5 mb-4">
            {mainItems.map((item) => (
              <SidebarLink key={item.href} item={item} isActive={isItemActive(item)} />
            ))}
          </nav>

          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">
            การเงิน
          </div>
          <nav className="space-y-0.5 mb-4">
            {billingItems.map((item) => (
              <SidebarLink key={item.href} item={item} isActive={isItemActive(item)} />
            ))}
          </nav>

          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">
            จัดการ
          </div>
          <nav className="space-y-0.5 mb-4">
            {/* Audience collapsible */}
            <Collapsible open={audienceOpen} onOpenChange={setAudienceOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Users className="w-[15px] h-[15px]" />
                  ผู้รับ
                </span>
                <ChevronDown
                  className={cn(
                    "w-[13px] h-[13px] transition-transform duration-200",
                    !audienceOpen && "-rotate-90"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-2">
                <div className="space-y-0.5 pt-0.5">
                  {audienceItems.map((item) => (
                    <SidebarLink key={item.href} item={item} isActive={isItemActive(item)} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {manageItems.map((item) => (
              <SidebarLink key={item.href} item={item} isActive={isItemActive(item)} />
            ))}
          </nav>

          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">
            ตั้งค่า
          </div>
          <nav className="space-y-0.5">
            {settingsItems.map((item) => (
              <SidebarLink key={item.href} item={item} isActive={isItemActive(item)} />
            ))}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="border-t border-[var(--border-default)] p-3">
          {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 px-2 py-2 w-full rounded-lg hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer">
              <Avatar className="w-9 h-9 rounded-full">
                <AvatarFallback className="bg-[var(--accent)] text-[var(--bg-base)] text-xs font-bold rounded-full">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-[var(--text-secondary)] font-medium truncate">{user.name}</div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48 bg-[var(--bg-surface)] border-[var(--border-default)]">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[var(--text-muted)]">บัญชีของฉัน</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/dashboard/settings")}
              >
                <Settings className="w-4 h-4" />
                ตั้งค่า
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/dashboard/packages/my")}
              >
                <Receipt className="w-4 h-4" />
                แพ็กเกจของฉัน
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  broadcastLogout();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : (
            <Link href="/login" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--text-on-accent)] text-sm font-semibold hover:opacity-90 transition-opacity justify-center">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-[var(--bg-base)] h-12 md:h-14 flex items-center justify-between px-4 md:px-8">
          <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            {title || sidebarItems.find((i) => i.href === pathname)?.label || "ภาพรวม"}
          </h1>

          <div className="flex items-center gap-2.5">
            {/* CMD+K Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCmdkOpen(true)}
              className="hidden sm:flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] h-10 px-3"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">ค้นหา...</span>
              <kbd className="ml-1 text-[10px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-[var(--text-muted)]">
                ⌘K
              </kbd>
            </Button>

            {/* Notifications */}
            <DropdownMenu onOpenChange={(open) => { if (open) handleNotifOpen(); }}>
              <DropdownMenuTrigger aria-label={unreadCount > 0 ? `การแจ้งเตือน (${unreadCount} ยังไม่อ่าน)` : "การแจ้งเตือน"} className="relative w-10 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.3)] flex items-center justify-center transition-colors duration-200 cursor-pointer">
                <Bell className="w-4 h-4 text-[var(--text-muted)]" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--error)] border-2 border-[var(--bg-base)] text-[10px] font-bold text-[var(--text-primary)] flex items-center justify-center p-0">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-80 bg-[var(--bg-surface)] border-[var(--border-default)]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[var(--text-primary)] text-sm font-semibold">
                    การแจ้งเตือน
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {notifs.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                    ไม่มีการแจ้งเตือน
                  </div>
                ) : (
                  notifs.slice(0, 5).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        n.type === "sms_success" && "bg-[rgba(16,185,129,0.1)] text-emerald-400",
                        n.type === "sms_failed" && "bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)]",
                        n.type === "topup" && "bg-[rgba(var(--accent-secondary-rgb,50,152,218),0.1)] text-[var(--accent-secondary)]",
                        !["sms_success", "sms_failed", "topup"].includes(n.type) && "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]"
                      )}>
                        {n.type === "sms_success" && <MessageSquare className="w-3.5 h-3.5" />}
                        {n.type === "sms_failed" && <MessageSquare className="w-3.5 h-3.5" />}
                        {n.type === "topup" && <CircleDollarSign className="w-3.5 h-3.5" />}
                        {!["sms_success", "sms_failed", "topup"].includes(n.type) && <Bell className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-secondary)] leading-snug">{n.message}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {formatThaiDateTimeShort(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer justify-center" onClick={() => router.push("/dashboard/notifications")}>
                  <span className="text-xs text-[var(--accent)]">ดูทั้งหมด →</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* SMS Remaining */}
            <Link
              href="/dashboard/packages/my"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 min-h-[44px] md:min-h-0 rounded-lg bg-[rgba(var(--accent-rgb),0.06)] border border-[rgba(var(--accent-rgb),0.15)] hover:border-[rgba(var(--accent-rgb),0.3)] transition-colors duration-200"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-sm font-bold text-[var(--accent)]">
                {smsRemaining.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--text-muted)]">SMS</span>
            </Link>

            {/* Mobile avatar */}
            {user ? (
              <Avatar className="w-8 h-8 rounded-lg md:hidden">
                <AvatarFallback className="bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)] text-xs font-semibold rounded-lg">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Link href="/login" className="text-xs text-[var(--accent)] font-semibold md:hidden">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </header>

        {/* Page Content — no page transitions per Nansen directive */}
        <div className="flex-1 pb-20 md:pb-0">{children}</div>

        {/* Footer */}
        <footer className="border-t border-[var(--border-default)] px-8 py-4 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>v1.0</span>
            <span>&copy; SMSOK</span>
          </div>
        </footer>
      </main>

      {/* ── CMD+K Search Dialog ── */}
      <CommandDialog
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        title="ค้นหาเมนู"
        description="พิมพ์เพื่อค้นหาเมนูหรือหน้าที่ต้องการ"
      >
        <Command>
          <CommandInput placeholder="ค้นหาเมนู..." />
          <CommandList>
            <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>
            <CommandGroup heading="เมนูหลัก">
              {mainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => {
                      router.push(item.href);
                      setCmdkOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="การเงิน">
              {billingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => {
                      router.push(item.href);
                      setCmdkOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="ผู้รับ">
              {audienceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => {
                      router.push(item.href);
                      setCmdkOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="จัดการ">
              {manageItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => {
                      router.push(item.href);
                      setCmdkOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="ตั้งค่า">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => {
                      router.push(item.href);
                      setCmdkOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      {/* ── Mobile Bottom Sheet ── */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="bg-[var(--bg-base)] border-t border-[var(--border-default)] rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle className="text-[var(--text-primary)]">เมนูเพิ่มเติม</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {sidebarItems
              .filter((i) => !["/dashboard", "/dashboard/send", "/dashboard/messages"].includes(i.href))
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSheetOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors duration-200",
                      isActive
                        ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)]"
                        : "text-[var(--text-muted)] hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
          </div>
          <Separator className="my-4 bg-[var(--border-subtle)]" />
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              broadcastLogout();
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[var(--error)] opacity-70 hover:opacity-100 hover:text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.05)] transition-colors duration-200 text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </SheetContent>
      </Sheet>

      {/* ── Re-consent Modal (PDPA policy version change) ── */}
      <ReconsentModal />

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-default)] bg-[var(--bg-base)] flex items-center justify-around px-2 py-2 safe-area-bottom">
        {[
          { href: "/dashboard", icon: LayoutDashboard, label: "ภาพรวม" },
          { href: "/dashboard/send", icon: Send, label: "ส่ง" },
          { href: "/dashboard/otp", icon: Lock, label: "OTP" },
          { href: "/dashboard/analytics", icon: BarChart3, label: "รายงาน" },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-3 rounded-lg transition-colors duration-200",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 text-[var(--text-muted)] cursor-pointer min-w-[44px] min-h-[44px]"
        >
          <MoreVertical className="w-5 h-5" />
          <span className="text-[10px]">เพิ่มเติม</span>
        </button>
      </nav>
    </div>
  );
}
