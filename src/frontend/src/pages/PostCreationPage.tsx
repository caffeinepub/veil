import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmotionType } from "../backend";
import EmotionBadge from "../components/EmotionBadge";
import { useCreatePost } from "../hooks/useQueries";

const EMOTION_OPTIONS = [
  {
    type: EmotionType.confess,
    label: "Confess",
    description: "Share something weighing on you",
  },
  {
    type: EmotionType.happy,
    label: "Happy",
    description: "Celebrate a moment of joy",
  },
  {
    type: EmotionType.broke,
    label: "Broke",
    description: "Express when things feel broken",
  },
];

export default function PostCreationPage() {
  const navigate = useNavigate();
  const createPost = useCreatePost();

  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>(
    EmotionType.confess,
  );
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something before submitting.");
      return;
    }

    try {
      const result = await createPost.mutateAsync({
        emotionType: selectedEmotion,
        content: content.trim(),
      });

      if (result.__kind__ === "ok") {
        toast.success("Your entry has been saved.");
        navigate({ to: "/posts" });
      } else {
        toast.error(result.err || "Failed to save entry.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create post.");
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold mb-2">New Entry</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Write freely. Your words are safe here.
      </p>

      <Card className="rounded-xl shadow-card border border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            How are you feeling?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emotion selector */}
          <div className="flex flex-wrap gap-3">
            {EMOTION_OPTIONS.map(({ type, description }) => (
              <button
                type="button"
                key={type}
                onClick={() => setSelectedEmotion(type)}
                className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
                  selectedEmotion === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <EmotionBadge emotionType={type} />
                <span className="mt-1 text-xs text-muted-foreground">
                  {description}
                </span>
              </button>
            ))}
          </div>

          {/* Content textarea */}
          <div className="space-y-2">
            <Label htmlFor="content">Your entry</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write what's on your mind..."
              className="min-h-[160px] resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={createPost.isPending || !content.trim()}
            className="w-full"
          >
            {createPost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Entry
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
