import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[#00F0FF] text-[#0A1320] shadow-[0_0_10px_rgba(0,240,255,0.2)]",
                secondary:
                    "border-transparent bg-[#FF9933] text-[#0A1320]",
                destructive:
                    "border-transparent bg-[#FF3366] text-white shadow-[0_0_10px_rgba(255,51,102,0.2)]",
                outline: "text-foreground",
                safe: "border-transparent bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.2)]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
