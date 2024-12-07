import { useDroppable } from '@dnd-kit/core';

const ProcessDroppableContainer = ({ processId, children }) => {
  const { setNodeRef } = useDroppable({ id: processId });

  return (
    <div ref={setNodeRef} className='p-4'>
      {children}
    </div>
  );
};

export default ProcessDroppableContainer;
