import { BLOCK_ICONS } from '@/blocks/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

/** Pick one of the block icons from a searchable grid */
export default function IconPicker({ id, value, onChange }: { id?: string; value: string; onChange: (icon: string) => void }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const Current = BLOCK_ICONS[value];
    const names = Object.keys(BLOCK_ICONS).filter((name) => name.includes(query.trim().toLowerCase()));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button id={id} type="button" variant="outline" className="w-full justify-between font-normal">
                    <span className="flex items-center gap-2">
                        {Current ? <Current className="text-primary h-4 w-4" /> : null}
                        <span className="text-sm">{value || t('Elige un ícono')}</span>
                    </span>
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">
                <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('Buscar ícono...')}
                    className="mb-2 h-8 text-xs"
                />
                <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
                    {names.map((name) => {
                        const Icon = BLOCK_ICONS[name];
                        return (
                            <button
                                key={name}
                                type="button"
                                title={name}
                                aria-label={name}
                                aria-pressed={name === value}
                                onClick={() => {
                                    onChange(name);
                                    setOpen(false);
                                    setQuery('');
                                }}
                                className={cn(
                                    'hover:bg-primary-soft hover:text-primary-soft-foreground flex h-9 items-center justify-center rounded-md',
                                    name === value && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
