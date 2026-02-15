"use client"

import * as React from "react"
import { Settings, Sun, Moon, Monitor, ExternalLink, Save, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useAppStore, type Market } from "@/lib/store"
import { STRATEGY_PRESETS } from "@/lib/strategy-presets"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function MarketSelector() {
    const {
        market, setMarket,
        investmentStrategy, setInvestmentStrategy,
        spreadsheetId,
        syncSettingsToSheets,
    } = useAppStore()
    const { theme, setTheme } = useTheme()

    // Local draft state for save/cancel behavior
    const [draftMarket, setDraftMarket] = React.useState<Market>(market)
    const [draftStrategy, setDraftStrategy] = React.useState(investmentStrategy)
    const [open, setOpen] = React.useState(false)
    const [saving, setSaving] = React.useState(false)

    // Reset drafts when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setDraftMarket(market)
            setDraftStrategy(investmentStrategy)
        }
        setOpen(isOpen)
    }

    const handleSave = async () => {
        setSaving(true)
        setMarket(draftMarket)
        setInvestmentStrategy(draftStrategy)

        // Sync settings to Google Sheets
        // Need a small delay so the store updates first
        setTimeout(async () => {
            try {
                await syncSettingsToSheets()
            } catch (e) {
                console.error("Settings sync failed:", e)
            }
            setSaving(false)
            setOpen(false)
        }, 100)
    }

    const handleCancel = () => {
        // Revert to saved values (already in store)
        setDraftMarket(market)
        setDraftStrategy(investmentStrategy)
        setOpen(false)
    }

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

    const hasChanges = draftMarket !== market || draftStrategy !== investmentStrategy

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure your market, theme, and AI strategy. Changes are synced to your Google account.
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
                                    variant={draftMarket === m.value ? "default" : "outline"}
                                    onClick={() => setDraftMarket(m.value)}
                                    className="w-full"
                                >
                                    {m.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Selection — applied immediately (no save needed) */}
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
                        <Select
                            value=""
                            onValueChange={(v) => setDraftStrategy(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a preset strategy..." />
                            </SelectTrigger>
                            <SelectContent>
                                {STRATEGY_PRESETS.map((preset) => (
                                    <SelectItem key={preset.label} value={preset.value}>
                                        {preset.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="E.g., I am a conservative investor looking for long-term growth and dividends."
                            value={draftStrategy}
                            onChange={(e) => setDraftStrategy(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Select a preset above or write your own. This guides the AI analysis for all stocks.
                        </p>
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
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
