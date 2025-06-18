import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ComponentProps, ReactElement } from "react";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeComponentType = NonNullable<Components["code"]>;
type CodeProps = ComponentProps<CodeComponentType>;

export default function CodeBlock({
  className,
  children,
}: CodeProps): ReactElement | null {
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  // Memoize the codeText to not rerender after each change
  const codeText = useMemo(
    () => String(children).replace(/\n$/, ""),
    [children],
  );

  // Copy button component
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      timer.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }, [codeText]);
  // This protect when copy button component unmounts before the 1.5s
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (lang) {
    return (
      <>
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-900 bg-cyan-700 px-4 py-2 text-white">
          <span className="text-sm font-semibold uppercase tracking-wide">
            {lang}
          </span>
          <button
            onClick={handleCopy}
            className={`min-w-[4.375rem] rounded border px-3 py-1 text-center text-xs font-medium transition ${
              copied
                ? "border-green-600 bg-green-500 bg-opacity-80"
                : "border-white border-opacity-30 bg-white bg-opacity-20 hover:bg-opacity-30"
            } `}
            aria-label={
              copied ? "Copied to clipboard" : "Copy code to clipboard"
            }
            aria-live="polite"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Code Block */}
        <SyntaxHighlighter
          language={lang}
          style={a11yDark}
          PreTag="div"
          wrapLines
          className="overflow-x-auto !bg-gray-900 !px-4 !py-3"
        >
          {codeText}
        </SyntaxHighlighter>
      </>
    );
  }
  return <code className={className}>{children}</code>;
}
