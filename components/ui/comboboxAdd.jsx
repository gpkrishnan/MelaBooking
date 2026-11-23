"use client"

import { useState } from "react"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ComboboxAdd({ options, value, onChange,disabled = false }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")

  const selectedLabel =
    options.find((option) => option.value === value)?.label || value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="flex-grow justify-between border"
          style={{ opacity: `${value ? 1 : 0.5}` }}
        >
          {value ? selectedLabel : "Select or type..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command shouldFilter={true}>
            <CommandInput
              placeholder="Search or type..."
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  onChange(input.trim())
                  setOpen(false)
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onChange(input.trim())
                    setOpen(false)
                  }}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Use "{input}"
                </Button>
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}
