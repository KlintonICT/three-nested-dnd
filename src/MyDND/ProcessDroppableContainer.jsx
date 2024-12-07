import { useDroppable } from '@dnd-kit/core';

const SubProcessDraggableItem = ({ processId, children }) => {
  const { setNodeRef } = useDroppable({ id: processId });

  return (
    <div ref={setNodeRef} className='p-4'>
      {children}
    </div>
  );
};

export default SubProcessDraggableItem;
