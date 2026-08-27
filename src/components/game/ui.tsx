import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

export function StageFrame({
  children,
  className,
  onPointerMove,
}: {
  children: ReactNode;
  className?: string;
  onPointerMove?: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <section
      onPointerMove={onPointerMove}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Display({
  children,
  className,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "p";
}) {
  return (
    <Tag
      className={cn(
        "font-display text-4xl leading-tight tracking-[-0.03em] text-balance text-bone sm:text-6xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Whisper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "max-w-md text-center font-sans text-sm leading-relaxed text-pretty text-ash",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function QuietButton({
  children,
  className,
  static: isStatic,
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  static?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={ref}
      className={cn(
        "min-h-11 min-w-11 px-4 font-sans text-sm tracking-[0.18em] text-bone/80",
        "transition-[opacity,color,transform] duration-150 ease-out",
        "hover:text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-bone/40",
        !isStatic && "active:scale-[0.96]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function QuietInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full max-w-xs border-0 border-b border-line bg-transparent px-1",
        "font-sans text-base text-bone caret-bone",
        "placeholder:text-dust",
        "transition-[border-color] duration-150",
        "focus:border-bone/50 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Door({
  label,
  taller,
  onPick,
}: {
  label: string;
  taller?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group flex w-20 flex-col items-center justify-end border border-line bg-ink",
        "transition-[border-color,transform] duration-200 ease-out",
        "hover:border-bone/35 active:scale-[0.96] sm:w-24",
        taller ? "h-56 sm:h-64" : "h-52 sm:h-60",
      )}
    >
      <span className="mb-6 font-sans text-[10px] tracking-[0.28em] text-dust group-hover:text-ash">
        {label}
      </span>
      <span className="mb-5 size-1.5 rounded-full bg-line group-hover:bg-ash" />
    </button>
  );
}
