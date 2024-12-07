import { useDroppable } from '@dnd-kit/core';

const SubProcessDraggableItem = ({ processId, children }) => {
  const { setNodeRef } = useDroppable({ id: processId });

  return (
    <div ref={setNodeRef} className='border border-[#3A3F4B] p-4 bg-[#181A1F] rounded-md'>
      {children}
    </div>
  );
};

export default SubProcessDraggableItem;
