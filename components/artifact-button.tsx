import { Button } from '@/components/ui/button';
import { FileCode } from 'lucide-react';
import { Artifact } from '@/components/artifacts/types';

interface ArtifactButtonProps {
  artifact: Artifact;
  onShowArtifact: (artifact: Artifact) => void;
}

export const ArtifactButton = ({ artifact, onShowArtifact }: ArtifactButtonProps) => {
  return (
    <Button variant="outline" size="sm" className="mt-2" onClick={() => onShowArtifact(artifact)}>
      {artifact.isStreaming ? (
        <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
      ) : (
        <FileCode className="w-4 h-4 mr-2" />
      )}
      {artifact.title}
      {artifact.isStreaming && <span className="text-xs text-muted-foreground ml-1">(generating...)</span>}
    </Button>
  );
};
