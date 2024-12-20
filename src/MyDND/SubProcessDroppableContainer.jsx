import { useDroppable } from '@dnd-kit/core';

const SubProcessDroppableContainer = ({ subprocessId, children }) => {
  const { setNodeRef } = useDroppable({ id: subprocessId });
  return (
    <div ref={setNodeRef} className='p-4'>
      {children}
    </div>
  );
};

export default SubProcessDroppableContainer;
