import * as React from 'react';

import { createTape, type TapeHandle } from '../tape/render';
import type { TapeConfig } from '../utils/types';

/** Same code as the mounted banner — same DOM, same stylesheet — inside a box. */
const TapePreview = ({ config }: { config: TapeConfig }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tapeRef = React.useRef<TapeHandle | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const tape = createTape(config);
    tapeRef.current = tape;
    container.appendChild(tape.element);

    return () => {
      tape.destroy();
      tapeRef.current = null;
    };
    // Mount once; later changes go through `update` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    tapeRef.current?.update(config);
  }, [config]);

  return <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }} />;
};

export default TapePreview;
