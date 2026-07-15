import { useState } from 'react';
import { useScene } from '@pascal-app/core';

export function useRenderIterations() {
  const nodes = useScene((state) => state.nodes);
  const [lastImage, setLastImage] = useState<string | null>(null);

  const runIterationPass = async (userFeedback: string) => {
    if (!lastImage) return;

    // Send the previous iteration image as the prompt frame to ensure maximum consistency
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        viewportSnapshot: lastImage,
        stylePrompt: `Apply these refinements: ${userFeedback}. Maintain everything else from the original image layout perfectly.`,
        sceneNodes: nodes
      })
    });

    const data = await res.json();
    if (data.success) {
      setLastImage(data.renderUrl);
    }
  };

  return { lastImage, setLastImage, runIterationPass };
}
