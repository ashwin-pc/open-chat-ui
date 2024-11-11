// BranchSelector.tsx
import { GitBranch } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Branch } from "@/lib/types"

interface BranchSelectorProps {
  currentBranchId: number
  branches: Branch[]
  onBranchChange: (branchId: number) => void
}

export function BranchSelector({ currentBranchId, branches, onBranchChange }: BranchSelectorProps) {
  return (
    <Select
      value={currentBranchId.toString()}
      onValueChange={(value) => onBranchChange(Number(value))}
    >
      <SelectTrigger className="w-[200px] md:w-[250px]">
        <SelectValue>
          <div className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4" />
            <span className="truncate">
              {branches.find(b => b.id === currentBranchId)?.name}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id.toString()} className="py-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="font-medium">{branch.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(branch.createdAt).toLocaleDateString()}
                </span>
              </div>
              {branch.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                  {branch.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                {branch.messages.length} messages
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}