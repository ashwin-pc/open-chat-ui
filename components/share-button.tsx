import { Button } from './ui/button';
import { Share2 } from 'lucide-react';
import { useChatContext } from '@/contexts/chat-context';
import { createShareUrl, isThreadShareable } from '@/lib/share-utils';
import { toast } from 'sonner';

export function ShareButton() {
  const { currentThread } = useChatContext();

  const handleShare = () => {
    if (!currentThread) return;

    try {
      if (!isThreadShareable(currentThread)) {
        toast.error(
          'Thread too large for URL sharing. Consider exporting as file instead. Contact @prsarma or @vkrisv or check #diya-amazon-internal-chatbot if this seems incorrect.',
          {
            duration: 5000,
          },
        );
        return;
      }

      const shareUrl = createShareUrl(currentThread);
      navigator.clipboard.writeText(shareUrl);
      toast.success('Thread link copied to clipboard');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          duration: 5000,
        });
      } else {
        toast.error('Failed to share thread', {
          duration: 5000,
        });
      }
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleShare} title="Share thread">
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
