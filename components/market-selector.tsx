"use client"

import { Settings, Sun, Moon, Monitor, ExternalLink } from "lucide-react"
import { useTheme } from "next-themes"
import { useAppStore, type Market } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function MarketSelector() {
    const { market, setMarket, investmentStrategy, setInvestmentStrategy, spreadsheetId } = useAppStore()
    const { theme, setTheme } = useTheme()

    const markets: { value: Market; label: string }[] = [
        { value: "US", label: "US (NASDAQ/NYSE)" },
        { value: "NSE", label: "India (NSE)" },
        { value: "BSE", label: "India (BSE)" },
        { value: "Global", label: "Global (All)" },
    ]

    const themes = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ]

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure your market, theme, and AI strategy.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                    {/* Market Selection */}
                    <div className="grid gap-2">
                        <Label>Primary Market</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {markets.map((m) => (
                                <Button
                                    key={m.value}
                                    variant={market === m.value ? "default" : "outline"}
                                    onClick={() => setMarket(m.value)}
                                    className="w-full"
                                >
                                    {m.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Selection */}
                    <div className="grid gap-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {themes.map((t) => {
                                const Icon = t.icon
                                return (
                                    <Button
                                        key={t.value}
                                        variant={theme === t.value ? "default" : "outline"}
                                        onClick={() => setTheme(t.value)}
                                        className="w-full flex items-center gap-2"
                                    >
                                        <Icon className="h-4 w-4" />
                                        {t.label}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Investment Strategy */}
                    <div className="grid gap-2">
                        <Label>Investment Strategy (AI Prompt)</Label>
                        <Textarea
                            placeholder="E.g., I am a conservative investor looking for long-term growth and dividends."
                            value={investmentStrategy}
                            onChange={(e) => setInvestmentStrategy(e.target.value)}
                        />
                    </div>

                    {/* Google Sheets Link */}
                    {spreadsheetId && (
                        <div className="grid gap-2">
                            <Label>Google Sheets</Label>
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm font-medium"
                            >
                                <ExternalLink className="h-4 w-4 text-primary" />
                                <span>Open Spreadsheet</span>
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
