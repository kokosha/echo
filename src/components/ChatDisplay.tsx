import { useMemo, memo, useState, useEffect } from "react";
import Markdown from "react-markdown";
import { unified, Plugin } from "unified";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkStringify from "remark-stringify";
import MemoizedCodeBlock from "./CodeBlock";
import { ChatMessage, useChatStore } from "../stores/useChatStore";
import { useShallow } from "zustand/react/shallow";
import { Root, Parent, Text, Node } from "mdast";

// WARNING: This have a fixed memory, doesn't remove or will render infinitely.
const EMPTY_MESSAGES: ChatMessage[] = [];
const PLACEHOLDER_MESSAGES = [
  "Ready when you are! Start typing to explore new ideas, ask questions, or just have a chat.",
  "Your conversation hub awaits! Share your thoughts or seek guidance—I'm here to assist.",
  "Let's make some magic happen! Type your message below and see what we can create together.",
  "Say hello, ask a question, or share your story — I'm eager to listen and respond!",
  "Embark on a new conversation! Type your message and let's dive into some interesting discussions.",
];

function isText(node: Node): node is Text {
  return node.type === "text";
}

function isParent(node: Node): node is Parent {
  return "children" in node && Array.isArray(node.children);
}

export const remarkConverter: Plugin<[], Root> = () => {
  return (tree: Root) => {
    function walk(node: Node): void {
      if (isText(node)) {
        node.value = node.value
          .replace(/\\\[(.+?)\\\]/g, (_,$1) => `$$ ${$1} $$`)
          .replace(/\\\((.+?)\\\)/g, (_,$1) => `$ ${$1} $`);
      }
      if (isParent(node)) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(tree);
  };
};

function normalizeDelimiters(src: string): string {
  // Convert \[ to \\\[
  const normalized_src =  src
    .replace(/\\\[/g, "\\\\[")
    .replace(/\\\]/g, "\\\\]")
    .replace(/\\\(/g, "\\\\(")
    .replace(/\\\)/g, "\\\\)");
  console.log(normalized_src)
  return normalized_src
}

async function normalizeMarkdown(input: string): Promise<string> {
  const preprocess = normalizeDelimiters(input);

  /*const file = await unified()
    .use(remarkParse)
    .use(remarkConverter)
    .use(remarkMath)
    .use(remarkStringify)
    .process("\[\nx^2\n\]");

  return String(file);*/


  const file = await unified()
    .use(remarkParse)
    .use(remarkConverter)
    .use(remarkMath)
    .use(remarkStringify, { fences: true, fence: "`" })
    .process(preprocess);
  return String(file);
}

function useNormalizedMarkdown(rawContent: string): string {
  const [normalizedContent, setNormalizedContent] = useState(rawContent);

  useEffect(() => {
    let isMounted = true;
    normalizeMarkdown(rawContent).then((processedContent) => {
      if (isMounted) {
        setNormalizedContent(processedContent);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [rawContent]);

  return normalizedContent;
}

export const UserMessageBody = memo(({ content }: { content: string }) => (
  <p className="whitespace-pre-wrap break-words">{content}</p>
));
UserMessageBody.displayName = "UserMessageBody";

const REMARK_PLUGINS = [remarkGfm, remarkBreaks, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];
const MD_COMPONENTS = { code: MemoizedCodeBlock };
export const AssistantMessageBody = memo<{ content: string }>(
  function AssistantMessageBody({ content }) {
    const normalized = useNormalizedMarkdown(content);
    return (
      <Markdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={MD_COMPONENTS}
      >
        {normalized}
      </Markdown>
    );
  },
);
AssistantMessageBody.displayName = "AssistantMessageBody";

interface MessageItemProps {
  message: ChatMessage;
}
export const MemoizedMessageItem = memo(({ message }: MessageItemProps) => {
  const isAssistant = message.role !== "user";

  return (
    <li
      className={`mb-2 flex ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[60%] overflow-auto rounded-2xl p-3 shadow-md ${
          isAssistant
            ? `${
                message.is_error ? "bg-red-800" : "bg-gray-600"
              } rounded-tl-none text-gray-100`
            : "rounded-tr-none bg-cyan-700 text-white"
        }`}
      >
        <strong className="mb-1 block text-lg font-semibold">
          {isAssistant && `${message.provider}:`}
        </strong>

        <div className="prose prose-invert mt-1 w-full max-w-5xl overflow-auto text-gray-100">
          {isAssistant ? (
            <AssistantMessageBody content={message.content} />
          ) : (
            <UserMessageBody content={message.content} />
          )}
        </div>
      </div>
    </li>
  );
});
MemoizedMessageItem.displayName = "MemoizedMessageItem";

function ChatDisplay() {
  const { messages, isChatLoading } = useChatStore(
    useShallow((state) => {
      const selectedChatId = state.selectedChatId;
      const currentChatMessages =
        selectedChatId != null
          ? state.chatMessages.get(selectedChatId)
          : undefined;

      const isChatLoading =
        selectedChatId != null ? !!state.chatLoading[selectedChatId] : false;

      return {
        messages: currentChatMessages ?? EMPTY_MESSAGES,
        isChatLoading: isChatLoading,
        selectedChatId: selectedChatId,
      };
    }),
  );

  const placeholder = useMemo(() => {
    const i = Math.floor(Math.random() * PLACEHOLDER_MESSAGES.length);
    return PLACEHOLDER_MESSAGES[i];
  }, []);

  return (
    <div className="flex h-full flex-1 flex-col border-gray-700">
      <div
        className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-gray-600 bg-gray-700 p-3 text-sm text-gray-300"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-xl italic text-gray-400">{placeholder}</p>
        ) : (
          messages.map((message) => (
            <MemoizedMessageItem key={message.id} message={message} />
          ))
        )}
        {isChatLoading && (
          <div className="flex items-center justify-center gap-2 p-4">
            <div className="flex translate-y-0.5 transform space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"></div>
            </div>
            <span className="ml-2 text-xl text-gray-300">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatDisplay;
