import { useChatContext } from "@/context/chat/context";
import { PromptProps, TChatMessage } from "@/hooks/use-chat-session";
import { TModelKey } from "@/hooks/use-model-list";
import { getRelativeDate } from "@/lib/date";
import { Quotes, Warning } from "@phosphor-icons/react";
import moment from "moment";
import { useEffect, useRef } from "react";
import { AIMessageBubble } from "./ai-bubble";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Avatar } from "./ui/avatar";
import { LabelDivider } from "./ui/label-divider";

export type TRenderMessageProps = {
  id: string;
  humanMessage: string;
  props?: PromptProps;
  model: TModelKey;
  aiMessage?: string;
  loading?: boolean;
};

export type TMessageListByDate = Record<string, TChatMessage[]>;

moment().calendar(null, {
  sameDay: "[Today]",
  nextDay: "[Tomorrow]",
  nextWeek: "dddd",
  lastDay: "[Yesterday]",
  lastWeek: "[Last] dddd",
  sameElse: "DD/MM/YYYY",
});

export const ChatMessages = () => {
  const { streamingMessage, currentSession } = useChatContext();
  const chatContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession]);

  const scrollToBottom = () => {
    if (chatContainer.current) {
      chatContainer.current.scrollTop = chatContainer.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (streamingMessage) {
      scrollToBottom();
    }
  }, [streamingMessage]);

  const isLastStreamBelongsToCurrentSession =
    streamingMessage?.sessionId === currentSession?.id;

  const renderMessage = (props: TRenderMessageProps) => {
    return (
      <div className="flex flex-col gap-1 items-start w-full" key={props.id}>
        {props.props?.context && (
          <div className="bg-black/30 rounded-2xl p-2 pl-3 text-sm flex flex-row gap-2 pr-4 border border-white/5">
            <Quotes size={16} weight="fill" className="flex-shrink-0" />

            <span className="pt-[0.35em] pb-[0.25em] leading-6">
              {props.props?.context}
            </span>
          </div>
        )}
        <div className="bg-black/30 rounded-2xl p-2 text-sm flex flex-row gap-2 pr-4 border border-white/5">
          <Avatar name="Deep" />
          <span className="pt-[0.35em] pb-[0.25em] leading-6">
            {props.humanMessage}
          </span>
        </div>

        <AIMessageBubble {...props} />
      </div>
    );
  };

  // group messages by createdAt date by days
  const messagesByDate = currentSession?.messages.reduce(
    (acc: TMessageListByDate, message) => {
      const date = moment(message.createdAt).format("YYYY-MM-DD");
      if (!acc?.[date]) {
        acc[date] = [message];
      } else {
        acc[date] = [...acc[date], message];
      }
      return acc;
    },
    {}
  );

  console.log(messagesByDate);

  return (
    <div
      className="flex flex-col w-full items-center h-screen overflow-y-auto pt-[60px] pb-[200px]"
      ref={chatContainer}
      id="chat-container"
    >
      <div className="w-[700px] flex flex-col gap-8">
        {messagesByDate &&
          Object.keys(messagesByDate).map((date) => {
            return (
              <div className="flex flex-col" key={date}>
                <LabelDivider label={getRelativeDate(date)} />

                <div className="flex flex-col gap-4 w-full items-start">
                  {messagesByDate[date].map((message) =>
                    renderMessage({
                      id: message.id,
                      humanMessage: message.rawHuman,
                      model: message.model,
                      props: message.props,
                      aiMessage: message.rawAI,
                    })
                  )}
                </div>
              </div>
            );
          })}

        {isLastStreamBelongsToCurrentSession &&
          streamingMessage?.props?.query &&
          !streamingMessage?.error &&
          renderMessage({
            id: "streaming",
            humanMessage: streamingMessage?.props?.query,
            aiMessage: streamingMessage?.message,
            model: streamingMessage?.model,
            loading: streamingMessage?.loading,
          })}

        {streamingMessage?.error && (
          <Alert variant="destructive">
            <Warning size={20} weight="bold" />
            <AlertTitle>Ahh! Something went wrong!</AlertTitle>
            <AlertDescription>{streamingMessage?.error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
