import { useToast } from "@/components/ui/use-toast";
import { getTestModelKey } from "@/helper/models";
import { modelService } from "@/services/models";
import { TProvider } from "@/types";
import { useState } from "react";
import { useAssistantUtils } from "./use-assistant-utils";

export const useLLMTest = () => {
  const { getModelByKey } = useAssistantUtils();
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(false);
  const { toast } = useToast();
  const testLLM = async (provider: TProvider, apiKey?: string) => {
    try {
      console.log("provider", provider);
      const modelKey = getTestModelKey(provider);

      console.log("apikey", apiKey);

      if (!apiKey) {
        return false;
      }

      const selectedModelKey = getModelByKey(modelKey, provider);

      console.log("selectedModelKey", selectedModelKey);
      if (!selectedModelKey) {
        return false;
      }

      const selectedModel = await modelService.createInstance({
        model: selectedModelKey,
        provider: provider,
        apiKey,
      });

      console.log("selectedModel", selectedModel);

      const data = await selectedModel
        .withListeners({
          onError: (error) => {
            console.error("error", error);
          },
        })
        .withConfig({
          recursionLimit: 2,
        })
        .invoke("This is Test Message", {
          callbacks: [
            {
              handleLLMError: (error) => {
                console.error("lll", error);
                throw new Error(error);
              },
            },
          ],
        });

      if (data) {
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const checkApiKey = async ({
    model,
    key,
    onValidated,
    onError,
  }: {
    model: TProvider;
    key: string;
    onValidated: () => void;
    onError: () => void;
  }) => {
    setIsCheckingApiKey(true);
    const isWorking = await testLLM(model, key);
    if (isWorking) {
      onValidated();
      toast({
        title: "API Key saved successfully",
        description: "Model is working as expected",
        variant: "default",
      });
    } else {
      onError();
      toast({
        title: "API Key Invalid",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
    }
    setIsCheckingApiKey(false);
  };

  return { testLLM, checkApiKey, isCheckingApiKey };
};
