import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
    "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-input hover:bg-input/80",
                active: "bg-primary",
            },
            size: {
                default: "h-5 w-9",
                sm: "h-4 w-7",
                lg: "h-6 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const switchThumbVariants = cva(
    "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
    {
        variants: {
            variant: {
                default: "translate-x-0",
                active: "translate-x-4",
            },
            size: {
                default: "h-4 w-4",
                sm: "h-3 w-3",
                lg: "h-5 w-5",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface SwitchProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof switchVariants> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, variant, size, checked, onCheckedChange, ...props }, ref) => {
        const handleClick = () => {
            onCheckedChange?.(!checked)
        }

        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                className={cn(switchVariants({ variant: checked ? "active" : "default", size, className }))}
                onClick={handleClick}
                ref={ref}
                {...props}
            >
        <span
            className={cn(switchThumbVariants({ variant: checked ? "active" : "default", size }))}
        />
            </button>
        )
    }
)
Switch.displayName = "Switch"

export { Switch, switchVariants }