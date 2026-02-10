"use client"

import { Settings } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function MarketSelector() {
    const { market, setMarket, investmentStrategy, setInvestmentStrategy } = useAppStore()

    const markets: { value: Market; label: string }[] = [
        { value: "US", label: "US (NASDAQ/NYSE)" },
        { value: "NSE", label: "India (NSE)" },
        { value: "BSE", label: "India (BSE)" },
        { value: "Global", label: "Global (All)" },
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
                    <DialogTitle>Market Settings</DialogTitle>
                    <DialogDescription>
                        Select your primary market for stock data.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Primary Market</Label>
                        <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid gap-2">
                        <Label>Investment Strategy (AI Prompt)</Label>
                        <Textarea
                            placeholder="E.g., I am a conservative investor looking for long-term growth and dividends."
                            value={investmentStrategy}
                            onChange={(e) => setInvestmentStrategy(e.target.value)}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
