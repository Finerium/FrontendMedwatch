/**
 * shadcn/ui Skeleton primitive. Plain server component used as a
 * loading placeholder.
 */
import { cn } from "@/lib/utils"

/**
 * Render a muted pulsing rectangle.
 *
 * @param props - Standard div props forwarded to the placeholder.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
