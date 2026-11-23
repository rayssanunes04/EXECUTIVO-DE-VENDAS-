import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const ALL = "__all__";

type Props = { label: string; options: string[] } & (
  { multiple?: false; value: string; onChange: (v: string) => void } |
  { multiple: true; value: string[]; onChange: (v: string[]) => void }
);
export function FilterCombo(props: Props) {
  const { label, value, options } = props;
  const [open, setOpen] = useState(false);
  const selected = props.multiple ? props.value : props.value === ALL ? [] : [props.value];
  const active = selected.length > 0;
  const select = (option: string) => {
    if (props.multiple) {
      props.onChange(option === ALL ? [] : selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option]);
    } else {
      props.onChange(option); setOpen(false);
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={label}
          className={cn(
            "flex h-10 w-full min-w-0 flex-col justify-center rounded-md border bg-card px-3 text-left transition-colors hover:border-secondary",
            active && "border-secondary ring-1 ring-secondary/30",
          )}
        >
          <span className="w-full truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="flex w-full min-w-0 items-center justify-between gap-1 text-sm font-medium text-foreground">
            <span className="truncate">{active ? selected.length === 1 ? selected[0] : `${selected.length} selecionados` : "Todos"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup>
              {[ALL, ...options].map((o) => (
                <CommandItem key={o} value={o === ALL ? "Todos" : o} onSelect={() => select(o)}>
                  <Check className={cn("mr-2 h-4 w-4", (o === ALL ? !active : selected.includes(o)) ? "opacity-100" : "opacity-0")} />
                  {o === ALL ? "Todos" : o}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
