import { Button } from '@/components/ui/button';
import { FileCode } from 'lucide-react';
import { Artifact, ArtifactType } from '@/components/artifacts/types';

interface ArtifactButtonProps {
  artifact: Artifact;
  onShowArtifact: (artifact: Artifact) => void;
}

export const ArtifactButton = ({ artifact, onShowArtifact }: ArtifactButtonProps) => {
  return (
    <Button variant="outline" size="sm" className="mt-2" onClick={() => onShowArtifact(artifact)}>
      <FileCode className="w-4 h-4 mr-2" />
      {artifact.title}
    </Button>
  );
};
